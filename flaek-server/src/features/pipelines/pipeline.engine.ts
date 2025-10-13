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
  // Encrypted values keyed by "nodeId.outputName"
  values: Map<string, any>;
  // Decrypted values (only for inputs and final outputs)
  decryptedInputs: Map<string, any>;
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
    }
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    this.validatePipeline(pipeline);
    const executionOrder = this.topologicalSort(pipeline);

    const context: ExecutionContext = {
      values: new Map(),
      decryptedInputs: new Map(Object.entries(inputs)),
    };

    const inputNodes = pipeline.nodes.filter(n => n.type === 'input');
    for (const inputNode of inputNodes) {
      const fieldName = inputNode.data?.fieldName || inputNode.id;
      if (inputs[fieldName] !== undefined) {
        context.values.set(`${inputNode.id}.value`, inputs[fieldName]);
      }
    }

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
        
        let result: any;
        if (options?.dryRun) {
          // Mock execution
          result = { result: 0 };
        } else {
          result = await this.executeBlock(block.circuit, nodeInputs, options);
        }

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
    options?: { cluster?: string }
  ): Promise<Record<string, any>> {
    try {
      const compDefOffset = getCircuitOffset(circuit);
      
      const payload = Buffer.from(JSON.stringify(inputs), 'utf8');
      
      const result = await this.arciumClient.submitQueue({
        mxeProgramId: this.mxeProgramId.toBase58(),
        compDefOffset,
        accounts: options?.cluster ? { cluster: options.cluster } : {},
        payload,
      });

      return result || { result: 0 };
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
      Object.assign(inputs, node.data);
    }

    const incomingEdges = pipeline.edges.filter(e => e.target === node.id);
    
    for (const edge of incomingEdges) {
      const sourceOutput = edge.sourceHandle || 'result';
      const targetInput = edge.targetHandle || 'value';
      
      const key = `${edge.source}.${sourceOutput}`;
      const value = context.values.get(key);
      
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

  async executeParallel(pipeline: PipelineDefinition, inputs: Record<string, any>): Promise<ExecutionResult> {
    return this.execute(pipeline, inputs);
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
