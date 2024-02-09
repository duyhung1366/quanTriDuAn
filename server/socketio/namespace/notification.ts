import { Socket } from "socket.io";
import { verifyAccessTokenWithDecodeData } from "../../middlewares/auth";
import logger from "../../utils/logger";

export const registerNotificationNamespace =
  (socket: Socket, addUser: (userId: string, socketId: string) => void, removeUser: (userId: string) => void) => {
    const decode = verifyAccessTokenWithDecodeData(socket.handshake.query.token as string);
    if (!decode) {
      return;
    }
    const userId = (decode as any).id;
    addUser(userId, socket.id);

    socket.on("disconnect", () => {
      const decode = verifyAccessTokenWithDecodeData(socket.handshake.query.token as string);
      const userId = (decode as any)?.id;
      // console.log("disconnect");
      logger.debug(userId + " disconnected");
      removeUser(userId);
    })
  }