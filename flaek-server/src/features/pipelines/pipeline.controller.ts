import { Request, Response } from 'express';
import { pipelineService } from './pipeline.service';

function httpError(status: number, code: string, message: string) {
  const error: any = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

async function createOperation(req: Request, res: Response) {
  const tenantId = (req as any).tenant.id;
  const { name, version, pipeline, mxeProgramId, datasetId } = req.body;

  if (!name || !version || !pipeline || !mxeProgramId) {
    throw httpError(400, 'invalid_body', 'Missing required fields');
  }

  const operation = await pipelineService.createOperationFromPipeline(
    tenantId,
    pipeline,
    { name, version, mxeProgramId, datasetId }
  );

  return res.status(201).json(operation);
}

async function execute(req: Request, res: Response) {
  const tenantId = (req as any).tenant.id;
  const { pipeline, inputs, mxeProgramId, dryRun, cluster } = req.body;

  if (!pipeline || !inputs || !mxeProgramId) {
    throw httpError(400, 'invalid_body', 'Missing required fields');
  }

  const result = await pipelineService.executePipeline(
    tenantId,
    pipeline,
    inputs,
    mxeProgramId,
    { dryRun, cluster }
  );

  return res.json({
    result: result.outputs,
    execution: {
      steps: result.steps,
      duration: result.duration,
      status: result.status,
    },
  });
}

async function validate(req: Request, res: Response) {
  const { pipeline } = req.body;

  if (!pipeline) {
    throw httpError(400, 'invalid_body', 'Pipeline is required');
  }

  const validation = await pipelineService.validatePipeline(pipeline);

  return res.json(validation);
}

async function getTemplates(req: Request, res: Response) {
  const templates = pipelineService.getPipelineTemplates();
  
  return res.json({ templates });
}

async function getTemplate(req: Request, res: Response) {
  const { templateId } = req.params;
  const templates = pipelineService.getPipelineTemplates();
  
  const template = templates.find(t => t.id === templateId);
  
  if (!template) {
    throw httpError(404, 'not_found', 'Template not found');
  }

  return res.json({ template });
}

// Draft management (stored in-memory for now, could be moved to DB)
const drafts = new Map<string, any>();

async function getDraft(req: Request, res: Response) {
  const tenantId = (req as any).tenant.id;
  const draft = drafts.get(tenantId);
  
  return res.json({ draft: draft || null });
}

async function saveDraft(req: Request, res: Response) {
  const tenantId = (req as any).tenant.id;
  const { pipeline } = req.body;
  
  if (!pipeline) {
    throw httpError(400, 'invalid_body', 'Pipeline is required');
  }
  
  drafts.set(tenantId, {
    pipeline,
    updatedAt: new Date().toISOString(),
  });
  
  return res.json({ 
    success: true,
    updatedAt: drafts.get(tenantId)?.updatedAt
  });
}

async function deleteDraft(req: Request, res: Response) {
  const tenantId = (req as any).tenant.id;
  drafts.delete(tenantId);
  
  return res.json({ success: true });
}

export const pipelineController = {
  createOperation,
  execute,
  validate,
  getTemplates,
  getTemplate,
  getDraft,
  saveDraft,
  deleteDraft,
};
