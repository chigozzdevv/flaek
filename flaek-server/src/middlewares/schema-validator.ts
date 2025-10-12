import { ZodTypeAny } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function schemaValidator(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parse = schema.safeParse({ body: req.body, query: req.query, params: req.params });
    if (!parse.success) {
      return res.status(400).json({ code: 'invalid_body', message: 'Validation failed', details: parse.error.flatten() });
    }
    next();
  };
}
