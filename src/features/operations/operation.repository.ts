import { OperationModel } from '@/features/operations/operation.model';

export const operationRepository = {
  async create(tenantId: string, data: {
    name: string; version: string; pipelineSpec: any; pipelineHash: string; artifactUri: string; runtime: 'container'|'wasm'|'arcium'; inputs: string[]; outputs: string[];
  }) {
    const op = new OperationModel({ tenantId, ...data });
    return op.save();
  },
  async list(tenantId: string) {
    return OperationModel.find({ tenantId }).sort({ createdAt: -1 }).exec();
  },
  async get(tenantId: string, operationId: string) {
    return OperationModel.findOne({ _id: operationId, tenantId }).exec();
  },
  async deprecate(tenantId: string, operationId: string) {
    return OperationModel.updateOne({ _id: operationId, tenantId }, { $set: { status: 'deprecated' } }).exec();
  },
};

