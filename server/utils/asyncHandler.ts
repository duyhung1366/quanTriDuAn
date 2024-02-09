import { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncRequestHandler = <P = any>(req: Request & P, res: Response, next?: NextFunction) => Promise<any>;

export default function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req, res, next) => fn(req, res, next).catch(next);
}