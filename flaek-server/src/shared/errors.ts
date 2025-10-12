export function httpError(status: number, code: string, message: string, details?: any) {
  const err: any = new Error(message);
  err.status = status;
  err.code = code;
  if (details) err.details = details;
  return err;
}

