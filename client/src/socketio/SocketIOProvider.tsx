import { useSnackbar } from "notistack";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { default as io, default as socketClient, Socket } from 'socket.io-client';
import { ProjectRole, TaskRole } from "../../../common/constants";
import Notification from "../../../common/models/notification";
import Task from "../../../common/models/task";
import SocketEvent from "../../../common/socketio/events";
import { mapTaskRoleName } from "../config/MapContraint";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { createSprintSocket, updateSprintSocket } from "../redux/slices/sprint.slice";
import { updateTaskRealTime, setUserTyping, cancelUserTyping, createTaskRealTime, deleteTaskRealTime, deleteMultipleTaskRealTime, moveTasksRealTime, cloneTasksRealTime } from "../redux/slices/task.slice";
import { ROUTER_TASK } from "../utils/router";
import { useProject } from "../hooks/useProject";
import { isAdmin } from "../config/admin-config";

const socketEndpoint = process.env.REACT_APP_SOCKET_ENDPOINT || "ws://localhost:3001";

type SocketNamespace = {
  // Socket Tong : /
  socket: Socket;
  // Socket Notifications: /notification
  notification: Socket;
  // TODO: add new namespace here
}
export const SocketContext = React.createContext<SocketNamespace>({
  socket: null,
  notification: null
})

// sử dụng nếu muốn emit bất cứ message nào
export const useSocket = () => React.useContext(SocketContext);

export const SocketIOProvider = ({ children, token }: { children?: any, token: string }) => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector((state) => state.authReducer.user);
  const mapUserData = useAppSelector((state) => state.userReducer.mapUserData);
  const currentProject = useAppSelector((state) => state.projectReducer.currentProject);
  const { getUserProject } = useProject()
  const userProject = getUserProject(currentProject?._id);
  const checkPermissionUser = [ProjectRole.OWNER, ProjectRole.SPRINT_MASTER].includes(userProject?.role) || isAdmin(currentUser)
  const [notificationSocket, setNotificationSocket] = useState<any>(null);
  const [_socket, setSocket] = useState<any>(null);

  // TODO: add new socket state here
  useEffect(() => {
    const notificationSocketInstance = io(`${socketEndpoint}/notification`, {
      path: `${process.env.PUBLIC_URL ?? ""}/socket.io`,
      query: {
        token
      }
    });
    setNotificationSocket(notificationSocketInstance);
    listenerProjectNotification(notificationSocketInstance)
    listenerAllEvent(notificationSocketInstance);
    return () => {
      notificationSocketInstance.close();
    }
  }, []);

  useEffect(() => {
    const socket = socketClient(socketEndpoint);
    setSocket(socket);
    socket.on(SocketEvent.TASK_CREATE, (body: { task: Task }) => {
      if (!body.task.userId) return
      dispatch(createTaskRealTime(body.task))
    })

    socket.on(SocketEvent.TASK_CHANGE_STATUS, (body: { task: Task }) => {
      dispatch(updateTaskRealTime(body.task))
    })

    socket.on(SocketEvent.TASK_UPDATE_NAME, (body: { task: Task }) => {
      dispatch(updateTaskRealTime(body.task))
    })

    socket.on("typing-client", (data) => {
      if (!data.cancelTyping) {
        dispatch(setUserTyping(data.userId))
        return;
      }
      dispatch(cancelUserTyping())
      // dispatch(updateTaskRealTime(data.task))
    });

    socket.on(SocketEvent.TASK_MOVE, (data) => {
      if (data.userId !== currentUser._id) {
        dispatch(moveTasksRealTime(data))
      }
    })

    socket.on(SocketEvent.TASK_CLONE, (data) => {
      if (data.userId !== currentUser._id) {
        dispatch(cloneTasksRealTime(data))
      }
    })

    socket.on(SocketEvent.TASK_ASSIGN, (body: { task: Task, from: string; to: string; role: TaskRole }) => {
      // if (currentUser._id !== body.from) {
      console.log("Test SocketIO", body);
      // const userFrom = mapUserData[body.from];
      // if (userFrom) {
      // const keySnackbar = `${body.from}-assign-task-${body.to}-on-${body.task._id}-as-${body.role}`;
      // enqueueSnackbar(
      //   <p><b>{userFrom.name}</b> đã assign bạn vào task {body.task.name} với vai trò <b>{mapTaskRoleName[body.role]}</b></p>,
      //   {
      //     variant: "info",
      //     autoHideDuration: 3000,
      //     onClick: () => {
      //       closeSnackbar(keySnackbar)
      //       window.location.href = `${ROUTER_TASK}/${body.task._id}`;
      //     },
      //     key: keySnackbar
      //   }
      // )
      // }
      // }
    });

    socket.on(SocketEvent.TASK_DELETE, (body: { task: Task }) => {
      if (currentUser._id !== body.task.userId && !checkPermissionUser) return
      dispatch(deleteTaskRealTime(body.task))
    })
    socket.on(SocketEvent.TASK_DELETE_MULTIPLE, (body: { ids: string[] }) => {
      if (!currentUser) return
      dispatch(deleteMultipleTaskRealTime(body.ids))
    })
    return () => {
      socket.close();
    }
  }, [])

  const listenerProjectNotification = (socket: Socket) => {
    socket.on(SocketEvent.PROJECT_UPDATE_TITLE, (args) => {
      // TODO

    })
    socket.on(SocketEvent.CREATE_SPRINT, (args) => {
      dispatch(createSprintSocket(args.data.newSprint))
    })
    socket.on(SocketEvent.SPRINT_UPDATE, (args) => {
      dispatch(updateSprintSocket(args.data.sprint))
    })
  }

  const listenerAllEvent = (socket: Socket) => {
    socket.onAny((eventName, args: Notification) => {
      // TODO:
      // enqueueSnackbar(`${args.event}: ${args.description}`)
    });
  }




  return (
    <SocketContext.Provider value={{ notification: notificationSocket, socket: _socket }}>
      {children}
    </SocketContext.Provider>
  )
}