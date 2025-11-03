import { getBlockById } from '../blocks/blocks.registry';
import { ArciumClient } from '@/clients/arcium-client';
import { PublicKey } from '@solana/web3.js';
import { getCircuitOffset } from './circuit-mapping';

export interface PipelineNode {
  id: string;
  blockId: string;
  type?: 'input' | 'output' | 'block';
  data?: Record<string, any>;
  position?: { x: number; y: number };
}

export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface PipelineDefinition {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  metadata?: {
    name?: string;
    description?: string;
    version?: string;
  };
}

export interface ExecutionContext {
  values: Map<string, any>;
}

export class PipelineEngine {
  private arciumClient: ArciumClient;
  private mxeProgramId: PublicKey;

  constructor(mxeProgramId: string) {
    this.arciumClient = new ArciumClient();
    this.mxeProgramId = new PublicKey(mxeProgramId);
  }

  async execute(
    pipeline: PipelineDefinition,
    inputs: Record<string, any>,
    options?: {
      cluster?: string;
      dryRun?: boolean;
      clientEncrypted?: boolean;
    }
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    this.validatePipeline(pipeline);
    const executionOrder = this.topologicalSort(pipeline);

    const context: ExecutionContext = {
      values: new Map(),
    };

    if (options?.clientEncrypted) {
      console.log(`[Pipeline Executor] Using client-encrypted inputs`);
      // No need to stash in context; pass directly to executeBlock
    } else {
      const inputNodes = pipeline.nodes.filter(n => n.type === 'input');
      console.log(`[Pipeline Executor] Loading ${inputNodes.length} input nodes with data:`, inputs);
      for (const inputNode of inputNodes) {
        const fieldName = inputNode.data?.fieldName || inputNode.id;
        if (inputs[fieldName] !== undefined) {
          const key = `${inputNode.id}.value`;
          const coerced = this.coerce(inputs[fieldName]);
          console.log(`[Pipeline Executor] Setting ${key} = ${coerced}`);
          context.values.set(key, coerced);
        }
      }
    }
    
    console.log(`[Pipeline Executor] Pipeline edges:`, JSON.stringify(pipeline.edges, null, 2));

    const executionSteps: ExecutionStep[] = [];

    for (const nodeId of executionOrder) {
      const node = pipeline.nodes.find(n => n.id === nodeId);
      if (!node) continue;

      if (node.type === 'input' || node.type === 'output') continue;

      const block = getBlockById(node.blockId);
      if (!block) {
        throw new Error(`Unknown block: ${node.blockId}`);
      }

      const nodeInputs = this.gatherNodeInputs(node, pipeline, context);
      const stepStart = Date.now();
      try {
        const clientEncData = options?.clientEncrypted ? inputs : undefined;
        const result = await this.executeBlock(block.circuit, nodeInputs, options, clientEncData);

        for (const [outputName, value] of Object.entries(result)) {
          context.values.set(`${nodeId}.${outputName}`, value);
        }

        executionSteps.push({
          nodeId,
          blockId: node.blockId,
          inputs: nodeInputs,
          outputs: result,
          duration: Date.now() - stepStart,
          status: 'success',
        });
      } catch (error: any) {
        const errorMessage = `Block '${block.name}' (${block.circuit}) failed: ${error.message}`;
        executionSteps.push({
          nodeId,
          blockId: node.blockId,
          inputs: nodeInputs,
          outputs: {},
          duration: Date.now() - stepStart,
          status: 'failed',
          error: errorMessage,
        });
        
        // Throw with block context
        const enhancedError = new Error(errorMessage);
        (enhancedError as any).blockId = node.blockId;
        (enhancedError as any).nodeId = nodeId;
        throw enhancedError;
      }
    }

    const outputNodes = pipeline.nodes.filter(n => n.type === 'output');
    const outputs: Record<string, any> = {};
    
    for (const outputNode of outputNodes) {
      const incomingEdges = pipeline.edges.filter(e => e.target === outputNode.id);
      for (const edge of incomingEdges) {
        const sourceOutput = edge.sourceHandle || 'result';
        const key = `${edge.source}.${sourceOutput}`;
        const value = context.values.get(key);
        if (value !== undefined) {
          const outputName = outputNode.data?.fieldName || outputNode.id;
          outputs[outputName] = value;
        }
      }
    }

    return {
      outputs,
      steps: executionSteps,
      duration: Date.now() - startTime,
      status: 'success',
    };
  }

  private async executeBlock(
    circuit: string,
    inputs: Record<string, any>,
    options?: { cluster?: string; dryRun?: boolean },
    clientEncryptedData?: any
  ): Promise<Record<string, any>> {
    try {
      console.log(`[Pipeline Executor] Executing circuit '${circuit}'`);

      // Dry-run: simulate execution without Arcium using core block logic
      if (options?.dryRun) {
        const simulated = this.simulateCircuit(circuit, inputs);
        return simulated;
      }

      const compDefOffset = getCircuitOffset(circuit);

      // Confidential computing: require client-encrypted data
      if (!clientEncryptedData) {
        throw new Error('Client-side encryption is required for confidential computing. Pipeline execution requires encrypted inputs.');
      }

      console.log(`[Pipeline Executor] Using client-encrypted data`);
      let ciphertexts: Array<number[] | Uint8Array> | undefined = undefined;
      if (Array.isArray(clientEncryptedData.ciphertexts)) {
        ciphertexts = clientEncryptedData.ciphertexts;
      } else if (clientEncryptedData.ct0 && clientEncryptedData.ct1) {
        ciphertexts = [clientEncryptedData.ct0, clientEncryptedData.ct1];
      } else {
        throw new Error('ciphertexts missing');
      }

      const txInfo = await this.arciumClient.submitQueue({
        mxeProgramId: this.mxeProgramId.toBase58(),
        compDefOffset,
        circuit,
        accounts: options?.cluster ? { cluster: options.cluster } : {},
        ciphertexts,
        clientPublicKey: Buffer.from(clientEncryptedData.client_public_key),
        clientNonce: typeof clientEncryptedData.nonce === 'string'
          ? Buffer.from(clientEncryptedData.nonce, 'base64')
          : Buffer.from(Uint8Array.from(clientEncryptedData.nonce)),
      });

      console.log(`[Pipeline Executor] Circuit '${circuit}' submitted, tx: ${txInfo.tx}`);

      return {
        tx: txInfo.tx,
        computationOffset: txInfo.computationOffset,
        nonceB64: (txInfo as any).nonceB64,
        clientPubKeyB64: (txInfo as any).clientPubKeyB64,
        status: 'submitted'
      };
    } catch (error: any) {
      throw new Error(`Failed to execute circuit '${circuit}': ${error.message}`);
    }
  }

  private gatherNodeInputs(
    node: PipelineNode,
    pipeline: PipelineDefinition,
    context: ExecutionContext
  ): Record<string, any> {
    const inputs: Record<string, any> = {};

    if (node.data) {
      const metadataKeys = ['label', 'blockId', 'block', 'fieldName'];
      for (const [key, value] of Object.entries(node.data)) {
        if (!metadataKeys.includes(key) && value !== undefined) {
          inputs[key] = value;
        }
      }
    }

    const incomingEdges = pipeline.edges.filter(e => e.target === node.id);
    
    for (const edge of incomingEdges) {
      // Find source node to determine the correct output key
      const sourceNode = pipeline.nodes.find(n => n.id === edge.source);
      const defaultOutput = sourceNode?.type === 'input' ? 'value' : 'result';
      
      const sourceOutput = edge.sourceHandle || defaultOutput;
      
      // For targetInput: use edge.targetHandle, or if source is an input node, use its fieldName
      let targetInput = edge.targetHandle;
      if (!targetInput && sourceNode?.type === 'input' && sourceNode.data?.fieldName) {
        targetInput = sourceNode.data.fieldName;
      }
      if (!targetInput) {
        targetInput = 'value';
      }
      
      const key = `${edge.source}.${sourceOutput}`;
      const value = this.coerce(context.values.get(key));
      
      console.log(`[Pipeline Executor] Edge ${edge.source} -> ${node.id}: looking for '${key}', found:`, value, `(will map to '${targetInput}')`);
      
      if (value !== undefined) {
        inputs[targetInput] = value;
      }
    }

    return inputs;
  }

  private topologicalSort(pipeline: PipelineDefinition): string[] {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    for (const node of pipeline.nodes) {
      graph.set(node.id, []);
      inDegree.set(node.id, 0);
    }

    for (const edge of pipeline.edges) {
      graph.get(edge.source)?.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    }

    const queue: string[] = [];
    const result: string[] = [];

    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      result.push(nodeId);

      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    if (result.length !== pipeline.nodes.length) {
      throw new Error('Pipeline contains cycles');
    }

    return result;
  }

  private validatePipeline(pipeline: PipelineDefinition): void {
    if (!pipeline.nodes || pipeline.nodes.length === 0) {
      throw new Error('Pipeline must have at least one node');
    }

    if (!pipeline.edges) {
      throw new Error('Pipeline must have edges');
    }

    for (const node of pipeline.nodes) {
      if (node.type === 'block' || !node.type) {
        const block = getBlockById(node.blockId);
        if (!block) {
          throw new Error(`Unknown block: ${node.blockId}`);
        }
      }
    }

    const nodeIds = new Set(pipeline.nodes.map(n => n.id));
    for (const edge of pipeline.edges) {
      if (!nodeIds.has(edge.source)) {
        throw new Error(`Edge references unknown source node: ${edge.source}`);
      }
      if (!nodeIds.has(edge.target)) {
        throw new Error(`Edge references unknown target node: ${edge.target}`);
      }
    }
  }

  // Helpers
  private coerce(v: any): any {
    if (typeof v === 'string') {
      const trimmed = v.trim();
      if (trimmed === '') return v;
      if (/^[-+]?\d+(?:\.\d+)?$/.test(trimmed)) {
        const num = Number(trimmed);
        return Number.isNaN(num) ? v : num;
      }
    }
    return v;
  }

  private asNum(v: any): number {
    const c = this.coerce(v);
    if (typeof c === 'number') return c;
    return Number(c) || 0;
  }

  private asBool01(v: any): number { return this.asNum(v) ? 1 : 0 }

  private simulateCircuit(circuit: string, rawInputs: Record<string, any>): Record<string, any> {
    // Coerce all numeric-like strings
    const inputs: Record<string, any> = {}
    for (const [k, v] of Object.entries(rawInputs)) inputs[k] = this.coerce(v)

    const out = (obj: Record<string, any>) => obj
    const nums = Object.values(inputs).map(v => this.asNum(v)).filter(v => !Number.isNaN(v))
    const first2 = (fallbackA?: number, fallbackB?: number): [number, number] => {
      if (typeof inputs.a !== 'undefined' && typeof inputs.b !== 'undefined') {
        return [this.asNum(inputs.a), this.asNum(inputs.b)]
      }
      if (typeof inputs.value !== 'undefined') {
        // common single-value key
        return [this.asNum(inputs.value), fallbackB ?? 0]
      }
      if (nums.length >= 2) return [nums[0], nums[1]]
      if (nums.length === 1) return [nums[0], fallbackB ?? 0]
      return [fallbackA ?? 0, fallbackB ?? 0]
    }

    switch (circuit) {
      // arithmetic
      case 'add': {
        if (typeof inputs.a !== 'undefined' || typeof inputs.b !== 'undefined') {
          return out({ result: this.asNum(inputs.a) + this.asNum(inputs.b) })
        }
        return out({ result: nums.reduce((a, b) => a + b, 0) })
      }
      case 'subtract': {
        const [a, b] = first2()
        return out({ result: a - b })
      }
      case 'multiply': {
        if (typeof inputs.a !== 'undefined' || typeof inputs.b !== 'undefined') {
          return out({ result: this.asNum(inputs.a) * this.asNum(inputs.b) })
        }
        return out({ result: nums.length ? nums.reduce((a, b) => a * b, 1) : 0 })
      }
      case 'divide': {
        const [a, b] = first2(0, 1)
        return out({ result: Math.floor(a / (b || 1)) })
      }
      case 'modulo': {
        const [a, b] = first2(0, 1)
        return out({ result: a % (b || 1) })
      }
      case 'power': {
        const [a, b] = first2(0, 1)
        return out({ result: Math.pow(a, b) })
      }

      // comparisons
      case 'greater_than': return out({ result: this.asNum(inputs.a) > this.asNum(inputs.b) ? 1 : 0 })
      case 'less_than': return out({ result: this.asNum(inputs.a) < this.asNum(inputs.b) ? 1 : 0 })
      case 'equal': return out({ result: this.asNum(inputs.a) === this.asNum(inputs.b) ? 1 : 0 })
      case 'greater_equal': return out({ result: this.asNum(inputs.a) >= this.asNum(inputs.b) ? 1 : 0 })
      case 'less_equal': return out({ result: this.asNum(inputs.a) <= this.asNum(inputs.b) ? 1 : 0 })

      // logic
      case 'and': return out({ result: (this.asBool01(inputs.a) && this.asBool01(inputs.b)) ? 1 : 0 })
      case 'or': return out({ result: (this.asBool01(inputs.a) || this.asBool01(inputs.b)) ? 1 : 0 })
      case 'xor': return out({ result: (this.asBool01(inputs.a) ^ this.asBool01(inputs.b)) ? 1 : 0 })
      case 'not': return out({ result: this.asBool01(inputs.a) ? 0 : 1 })

      // control flow
      case 'if_else': return out({ result: this.asBool01(inputs.condition) ? this.asNum(inputs.true_value) : this.asNum(inputs.false_value) })
      case 'in_range': {
        const v = this.asNum(inputs.value)
        const min = this.asNum(inputs.min)
        const max = this.asNum(inputs.max)
        return out({ result: v >= min && v <= max ? 1 : 0 })
      }
      case 'meets_threshold': {
        const v = this.asNum(inputs.value)
        const t = this.asNum(inputs.threshold)
        return out({ result: v >= t ? 1 : 0 })
      }

      // statistical
      case 'sum': {
        const arr = Array.isArray(inputs.values) ? inputs.values.map(v => this.asNum(v)) : []
        const count = this.asNum(inputs.count) || arr.length
        return out({ result: arr.slice(0, count).reduce((a, b) => a + b, 0) })
      }
      case 'average': {
        const arr = Array.isArray(inputs.values) ? inputs.values.map(v => this.asNum(v)) : []
        const count = this.asNum(inputs.count) || arr.length
        const slice = arr.slice(0, count)
        const sum = slice.reduce((a, b) => a + b, 0)
        return out({ result: slice.length ? Math.floor(sum / slice.length) : 0 })
      }
      case 'min': {
        const arr = Array.isArray(inputs.values) ? inputs.values.map(v => this.asNum(v)) : []
        const count = this.asNum(inputs.count) || arr.length
        const slice = arr.slice(0, count)
        return out({ result: slice.length ? Math.min(...slice) : 0 })
      }
      case 'max': {
        const arr = Array.isArray(inputs.values) ? inputs.values.map(v => this.asNum(v)) : []
        const count = this.asNum(inputs.count) || arr.length
        const slice = arr.slice(0, count)
        return out({ result: slice.length ? Math.max(...slice) : 0 })
      }
      case 'median': {
        const arr = Array.isArray(inputs.values) ? inputs.values.map(v => this.asNum(v)) : []
        const count = this.asNum(inputs.count) || arr.length
        const s = arr.slice(0, count).sort((a, b) => a - b)
        if (!s.length) return out({ result: 0 })
        const mid = Math.floor(s.length / 2)
        return out({ result: s.length % 2 ? s[mid] : Math.floor((s[mid - 1] + s[mid]) / 2) })
      }
      case 'weighted_average': {
        const values = Array.isArray(inputs.values) ? inputs.values.map(v => this.asNum(v)) : []
        const weights = Array.isArray(inputs.weights) ? inputs.weights.map(v => this.asNum(v)) : []
        const n = Math.min(values.length, weights.length)
        if (!n) return out({ result: 0 })
        let ws = 0, sum = 0
        for (let i = 0; i < n; i++) { sum += values[i] * weights[i]; ws += weights[i]; }
        return out({ result: ws ? Math.floor(sum / ws) : 0 })
      }

      // simple use cases
      case 'vote_tally': {
        const v = this.asBool01(inputs.vote)
        return out({ result: v })
      }
      case 'credit_score': {
        const income = this.asNum(inputs.income)
        const debt = this.asNum(inputs.debt)
        const credit_history = this.asNum(inputs.credit_history)
        const missed_payments = this.asNum(inputs.missed_payments)
        let score = 600 + Math.floor((income - debt) / 1000) + credit_history * 5 - missed_payments * 20
        score = Math.max(300, Math.min(850, score))
        const approved = score >= 650 ? 1 : 0
        return { score, approved }
      }
      case 'health_risk': {
        const age = this.asNum(inputs.age)
        const bmi = this.asNum(inputs.bmi)
        const smoker = this.asBool01(inputs.smoker)
        const exercise = this.asNum(inputs.exercise_hours)
        const fam = this.asBool01(inputs.family_history)
        let risk = Math.min(100, Math.max(0, Math.floor(age * 0.3 + (bmi - 18) * 2 + smoker * 20 + fam * 15 - exercise * 2)))
        let category = 0
        if (risk >= 75) category = 3
        else if (risk >= 50) category = 2
        else if (risk >= 25) category = 1
        return { risk_score: risk, risk_category: category }
      }
      default: {
        const nums = Object.values(inputs).map(v => this.asNum(v)).filter(v => !Number.isNaN(v))
        return out({ result: nums.length ? nums[0] : 0 })
      }
    }
  }
}

export interface ExecutionStep {
  nodeId: string;
  blockId: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  duration: number;
  status: 'success' | 'failed';
  error?: string;
}

export interface ExecutionResult {
  outputs: Record<string, any>;
  steps: ExecutionStep[];
  duration: number;
  status: 'success' | 'failed';
  error?: string;
}
