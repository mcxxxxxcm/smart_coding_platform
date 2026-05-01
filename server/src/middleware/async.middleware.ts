import { Request, Response, NextFunction } from 'express';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function bindController<T extends Record<string, any>>(controller: T): T {
  const bound: Record<string, any> = {};
  for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(controller))) {
    if (key === 'constructor') continue;
    const method = controller[key];
    if (typeof method === 'function') {
      bound[key] = asyncHandler(method.bind(controller));
    }
  }
  return bound as T;
}
