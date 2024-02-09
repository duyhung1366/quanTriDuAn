import { NextFunction, Request, Response } from "express";
import { failureResponse } from "../utils/apiUtils";
import { ServerError } from "../utils/errors";
import logger from "../utils/logger";

export const handleAPIError = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err) {
    if (err instanceof ServerError) {
      const { status, message, data } = err;
      return failureResponse(res, status, { message, data });
    }
    logger.error('[ERROR]', err);
    return failureResponse(res, 500, { message: "Internal Server Error" });
  }
  return next();
}

export const handleNotFoundError = (req: Request, res: Response, next: NextFunction) => {
  failureResponse(res, 404, { message: `Endpoint ${req.method} ${req.url} not found` });
  return next();
}