import { verifyAccessToken } from "../../middlewares/auth";

/**
 * Verify access token each request
 * @param socket 
 * @param next 
 * @returns 
 */
export const ioAuth = (socket, next: Function) => {
  if (socket.handshake.query && socket.handshake.query.token) {
    const decode = verifyAccessToken(socket.handshake.query.token);
    if (!decode && !(decode as any)?.id) {
      return next(new Error('Authentication error'));
    }    
    next();
  }
  else {
    next(new Error('Authentication error'));
  }
}