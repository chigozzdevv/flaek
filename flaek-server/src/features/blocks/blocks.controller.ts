import { Request, Response } from 'express';
import { BLOCKS_REGISTRY, getBlockById, getBlocksByCategory, searchBlocks } from './blocks.registry';

async function listBlocks(req: Request, res: Response) {
  const { category, tag, search } = req.query;

  let blocks = BLOCKS_REGISTRY;

  if (category && typeof category === 'string') {
    blocks = getBlocksByCategory(category as any);
  }

  if (search && typeof search === 'string') {
    blocks = searchBlocks(search);
  }

  if (tag && typeof tag === 'string') {
    blocks = blocks.filter(b => b.tags?.includes(tag));
  }

  return res.json({
    blocks: blocks.map(b => ({
      id: b.id,
      name: b.name,
      category: b.category,
      description: b.description,
      inputs: b.inputs,
      outputs: b.outputs,
      icon: b.icon,
      color: b.color,
      tags: b.tags,
      examples: b.examples,
    })),
    total: blocks.length,
  });
}

async function getBlock(req: Request, res: Response) {
  const { blockId } = req.params;
  
  const block = getBlockById(blockId);
  
  if (!block) {
    return res.status(404).json({
      code: 'not_found',
      message: 'Block not found',
    });
  }

  return res.json({ block });
}

async function getCategories(req: Request, res: Response) {
  const categories = [
    { id: 'math', name: 'Math Operations', icon: 'Calculator' },
    { id: 'comparison', name: 'Comparisons', icon: 'Scale' },
    { id: 'logical', name: 'Logic', icon: 'GitBranch' },
    { id: 'statistical', name: 'Statistics', icon: 'TrendingUp' },
    { id: 'use_case', name: 'Use Cases', icon: 'Package' },
  ];

  const categoriesWithCounts = categories.map(cat => ({
    ...cat,
    count: getBlocksByCategory(cat.id as any).length,
  }));

  return res.json({ categories: categoriesWithCounts });
}

async function validatePipeline(req: Request, res: Response) {
  const { pipeline } = req.body;

  if (!pipeline || !pipeline.nodes || !pipeline.edges) {
    return res.status(400).json({
      code: 'invalid_pipeline',
      message: 'Pipeline must have nodes and edges',
    });
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  for (const node of pipeline.nodes) {
    const block = getBlockById(node.blockId);
    
    if (!block) {
      errors.push(`Node ${node.id}: Unknown block '${node.blockId}'`);
      continue;
    }

    for (const input of block.inputs) {
      if (input.required) {
        const hasInput = pipeline.edges.some(
          (e: any) => e.target === node.id && e.targetHandle === input.name
        ) || node.data?.[input.name] !== undefined;

        if (!hasInput) {
          errors.push(`Node ${node.id}: Missing required input '${input.name}'`);
        }
      }
    }

    if (node.data) {
      for (const [key, value] of Object.entries(node.data)) {
        const inputDef = block.inputs.find(i => i.name === key);
        if (inputDef) {
          if (inputDef.min !== undefined && typeof value === 'number' && value < inputDef.min) {
            warnings.push(`Node ${node.id}: Input '${key}' below minimum (${inputDef.min})`);
          }
          if (inputDef.max !== undefined && typeof value === 'number' && value > inputDef.max) {
            warnings.push(`Node ${node.id}: Input '${key}' above maximum (${inputDef.max})`);
          }
        }
      }
    }
  }

  const hasCycle = detectCycle(pipeline.nodes, pipeline.edges);
  if (hasCycle) {
    errors.push('Pipeline contains circular dependencies');
  }

  const connectedNodes = new Set<string>();
  pipeline.edges.forEach((e: any) => {
    connectedNodes.add(e.source);
    connectedNodes.add(e.target);
  });
  
  const inputNodes = pipeline.nodes.filter((n: any) => n.type === 'input');
  const outputNodes = pipeline.nodes.filter((n: any) => n.type === 'output');
  
  for (const node of pipeline.nodes) {
    if (node.type !== 'input' && node.type !== 'output' && !connectedNodes.has(node.id)) {
      warnings.push(`Node ${node.id} is not connected`);
    }
  }

  const isValid = errors.length === 0;

  return res.json({
    valid: isValid,
    errors,
    warnings,
    stats: {
      nodeCount: pipeline.nodes.length,
      edgeCount: pipeline.edges.length,
      inputNodes: inputNodes.length,
      outputNodes: outputNodes.length,
    },
  });
}

function detectCycle(nodes: any[], edges: any[]): boolean {
  const graph = new Map<string, string[]>();
  
  nodes.forEach(n => graph.set(n.id, []));
  edges.forEach(e => {
    const neighbors = graph.get(e.source) || [];
    neighbors.push(e.target);
    graph.set(e.source, neighbors);
  });

  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recStack.add(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true; // Cycle detected
      }
    }

    recStack.delete(nodeId);
    return false;
  }

  for (const nodeId of graph.keys()) {
    if (!visited.has(nodeId)) {
      if (dfs(nodeId)) return true;
    }
  }

  return false;
}

export const blocksController = {
  listBlocks,
  getBlock,
  getCategories,
  validatePipeline,
};
