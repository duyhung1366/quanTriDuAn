import { randomUUID } from "crypto";
import { Server } from "socket.io";
import Notification from "../../common/models/notification";
import SocketEvent from "../../common/socketio/events";
import { NotificationModel } from "../database/mongo/notification.model";
import logger from "../utils/logger";
import { ioAuth } from "./middlewares/auth";
import { registerNotificationNamespace } from "./namespace/notification";
import SocketIO from 'socket.io';
import Project from "../../common/models/project";
import Task from "../../common/models/task";
import User from "../../common/models/user";
import { TaskRole } from "../../common/constants";
import TaskService from '../services/work/task';

// let io: SocketIO.Server;


const notificationNamespaceUsers: { [userId: string]: string } = {};
export class SocketIo {
  private io: Server | null = null;
  // lưu lại id của user và id socket

  constructor(httpServer: any) {
    const isDev = process.env.NODE_ENV !== "production";
    const envOrigins = process.env.SOCKET_ORIGIN;
    const prodOrigins = typeof envOrigins === "string" ? envOrigins.split(",") : [];
    if (!isDev && !prodOrigins.length) {
      throw new Error("Socket Origins is Required");
    }
    if (httpServer) {
      this.io = new Server(httpServer, {
        path: `${process.env.BASE_URL ?? ""}/socket.io`,
        cors: {
          origin: isDev
            ? "http://localhost:3000"
            : prodOrigins,
          methods: ["GET", "POST"]
        }
      });
      logger.info("io: socket connect http server successfully!");
    } else {
      throw new Error("httpServer is required!");
    }
  }

  public setMiddleware() {
    //TODO: add new middleware 
  }

  private addNotificationNamespaceUser(userId: string, socketId: string) {
    notificationNamespaceUsers[userId] = socketId;
  }
  private removeNotificationNamespaceUUser(userId: string) {
    delete notificationNamespaceUsers[userId];
  }
  public connection() {
    // middleware
    this.io?.of("/notification").use(ioAuth);
    this.io
      ?.of("/notification")
      ?.on("connection",
        (socket) => registerNotificationNamespace(socket, this.addNotificationNamespaceUser, this.removeNotificationNamespaceUUser));

    // Namespace SocketIO
    this.io
      ?.on("connection", (socket) => {
        socket.on("join-room", (args: { roomId: string; roomType: string; }) => {
          const { roomId, roomType } = args;
          socket.join(roomId);
          // console.log("client " + socket.id + " joined");
          if (roomType === "task-detail") {
            // TODO: getCurrentUserTyping -> variable ->
            // const currentUserTyping = TaskService.getCurrentUserTyping(roomId);
            // Emit
            // Đoạn này em xử lý từ client luôn đựược k anh ? Tức là ô nào focus vào ck editor ==> emit to server
          }
        });

        socket.on("typing", (args: { taskId: string; userId: string, cancelTyping?: boolean, description?: string, leaveRoom?: boolean }) => {
          // this.io?.of("/")?.in(args.taskId)?.emit("typing-client", args);
          this.io?.of("/")?.in(args.taskId)?.to(args.taskId)?.except(socket.id)?.emit("typing-client", args);
          if (args.cancelTyping && args.leaveRoom) {
            socket.leave(args.taskId);
          }
        })
      });
  }

  public emitNotification(namespace: string, event: string, data: Notification, to: Array<string> | "all", excludeIds: string[] = []) {


    let socketIdList: Array<string> = [];
    if (Array.isArray(to)) {
      socketIdList = to.map((userId) => notificationNamespaceUsers[userId]).filter(e => !!e) as Array<string>;
    } else if (to === "all") {
      socketIdList = Object.keys(notificationNamespaceUsers)
        .filter((uid) => !excludeIds.includes(uid))
        .map((uid) => notificationNamespaceUsers[uid])
        .filter((e) => !!e);
    }

    // TODO: New Notification Model
    // const notification = new NotificationModel(data);

    if (to === "all" && !excludeIds.length) {
      this.io?.of(namespace).emit(event, data);
    } else {
      socketIdList.forEach(item => {
        this.io?.of(namespace).to(item).emit(event, data);
      })
    }
    // this.io?.of(namespace).emit(event, notification);
    // notification.save();
  }

  public updateStatusTask = (props: { task: Task }) => {
    this.io?.sockets?.emit(SocketEvent.TASK_CHANGE_STATUS, props);
  }
  public updateDescriptionTask = (props: { task: Task, userTyping: string | null }) => {
    this.io?.sockets?.emit(SocketEvent.TASK_CHANGE_DESCRIPTION, props);
  }
  public assignUserToTask = (props: { task: Task; from: string; to: string, role: TaskRole; }) => {
    this.io?.sockets?.emit(SocketEvent.TASK_ASSIGN, props);
  }
  public updateNameTask = (props: { task: Task }) => {
    this.io?.sockets?.emit(SocketEvent.TASK_UPDATE_NAME, props);
  }
  public createTask = (props: { task: Task }) => {
    this.io?.sockets?.emit(SocketEvent.TASK_CREATE, props);
  }
  public deleteTask = (props: { task: Task }) => {
    this.io?.sockets?.emit(SocketEvent.TASK_DELETE, props);
  }
  public deleteMultipleTask = (props: { ids: string[] }) => {
    this.io?.sockets?.emit(SocketEvent.TASK_DELETE_MULTIPLE, props);
  }

  public moveTasks = (props: { data: any[], tasksUpdated: any[], userId: string }) => {
    this.io?.sockets?.emit(SocketEvent.TASK_MOVE, props);
  }

  public cloneTasks = (props: { data: any[], userId: string }) => {
    this.io?.sockets?.emit(SocketEvent.TASK_CLONE, props);
  }

}

