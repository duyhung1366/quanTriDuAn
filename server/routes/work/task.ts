import { Router } from "express";
import { TaskRole, TaskStatus } from "../../../common/constants";
import Task from "../../../common/models/task";
import TaskService, { CopyTasksArgs } from "../../services/work/task";
import asyncHandler from "../../utils/asyncHandler";
import { BadRequestError } from "../../utils/errors";
import {
  NotificationDoc,
  NotificationModel,
} from "../../database/mongo/notification.model";
import { AuthRequest } from "../../types/Request";
import DiscordService from "../../services/affiliate/discord";
import { json } from "stream/consumers";
import { ParseQuery } from "../../utils/apiUtils";
const moment = require("moment");

export const mapStatusTask = {
  [TaskStatus.OPEN]: "TO DO",
  [TaskStatus.IN_PROGRESS]: "IN PROGRESS",
  [TaskStatus.BUG]: "BUG",
  [TaskStatus.REVIEW]: "REVIEW",
  [TaskStatus.COMPLETE]: "COMPLETE",
};
const mapRoleMember = {
  [TaskRole.ASSIGNEE]: "ASSIGNEE",
  [TaskRole.REVIEWER]: "REVIEWER",
  [TaskRole.TESTER]: "TESTER",
};
const notificationEvent = "TaskAssigned";
const router = Router();

// router.post(
//   "/tasks",
//   asyncHandler(async (req, res) => {
//     const reqBody = <Task>req.body;

//     ["projectId", "name"].forEach((key) => {
//       if (!reqBody[key])
//         throw new BadRequestError({ data: `${key} is required.` });
//     });
//     const data = await TaskService.createTask({
//       ...req.body,
//     });
//     return res.json(data);
//   })
// );

router.post(
  "/tasks",
  asyncHandler(async (req: AuthRequest, res) => {
    const reqBody = req.body?.data;
    const assignees = req.body?.assignees;
    const userId = req?.credentials?.id!;
    ["projectId", "name"].forEach((key) => {
      if (!reqBody[key])
        throw new BadRequestError({ data: `${key} is required.` });
    });
    const data = await TaskService.createTask({
      task: req.body.data,
      assignees,
      userId
    });
    return res.json(data);
  })
);


// API For Dashboard --> get By User & ProjectIds
router.get("/tasks/allTask", asyncHandler(async (req, res) => {
  const {
    from: _from,
    to: _to,
    // user_id
    user_id: _user_id,
    project_ids: _project_ids
  } = req.query;
  const from = typeof _from === "string" && !isNaN(+_from) ? +_from : 0;
  const to = typeof _to === "string" && !isNaN(+_to) ? +_to : 0;
  const userId = ParseQuery.str(_user_id);
  const projectIds = ParseQuery.arrStr(_project_ids);
  const data = await TaskService.listAllTask({ from, to, userId, projectIds })
  return res.json(data)
}))
router.get(
  "/tasks",
  asyncHandler(async (req, res) => {
    const projectId = req.query.projectId as string;
    const sortOrder = req.query.sortOrder as "desc" | "asc";
    const parentId = req.query.parentId as string;
    const skip = +((req.query.skip as string) ?? 0);
    // const limit = +(req.query.limit as string ?? 10);
    const _status = req.query.status as string;
    const status = typeof _status !== "undefined" ? +_status : undefined;

    const data = await TaskService.listTasks({
      projectId,
      sortOrder,
      parentId,
      skip,
      status,
    });
    return res.json(data);
  })
);

router.patch(
  "/tasks/updatePositionTask/:taskId",
  asyncHandler(async (req, res) => {
    const taskId = req.params.taskId as string;
    const args = req.body;
    const childCurrentTaskId: string = args.childCurrentTaskId;
    const childDestinationTaskId: string = args.childDestinationTaskId;
    const parentDestinationTaskId: string = args.parentDestinationTaskId;
    const data = await TaskService.updatePositionTask(
      taskId,
      childCurrentTaskId,
      childDestinationTaskId,
      parentDestinationTaskId,
      args
    );
    return res.json(data);
  })
);

router.patch(
  "/tasks/:id",
  asyncHandler(async (req: AuthRequest, res) => {
    const taskId = req.params.id as string;
    const args = req.body;
    const userId = req?.credentials?.id!;
    const data = await TaskService.updateTask(
      taskId,
      args,
      userId
    );

    return res.json(data);
  })
);


router.get(
  "/tasks/:taskId",
  asyncHandler(async (req, res) => {
    const taskId = req.params.taskId as string;
    const data = await TaskService.getTaskById(taskId);
    if (!data) {
      return null;
    }
    return res.json(data);
  })
);

router.delete(
  "/tasks/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await TaskService.deleteTask({ id });
    return res.json(data);
  })
);

router.post(
  "/tasks/delete",
  asyncHandler(async (req, res) => {
    const { ids } = req.body;
    const data = await TaskService.deleteMultipleTask({ ids });
    return res.json(data);
  })
);
// assign members

router.post(
  "/tasks/:taskId/assign",
  asyncHandler(async (req: AuthRequest, res) => {
    const from = req.credentials!.id;
    const taskId = req.params.taskId;
    const userId = req.body.userId as string;
    const role = req.body.role as TaskRole;
    const discordId = req.body.discordId as string;
    const nameStatusTask = req.body.nameStatusTask as string;
    const nameUserAssign = req.body.nameUserAssign as string;
    const idUserAssign = req.body.idUserAssign as string;

    const data = await TaskService.assignUserToTask({
      from,
      taskId,
      userId,
      role,
    });
    const dataTask = await TaskService.getTaskById(taskId);
    const formattedDeadline = moment(dataTask?.deadline).format(
      "DD/MM/yyyy, hh:mm a"
    );
    const notification: NotificationDoc = new NotificationModel({
      event: `${notificationEvent}`,
      description: `${dataTask?.name}`,
      link: `${process.env.BASE_TASK_URL}/${taskId}`,
      createdAt: Date.now(),
    });
    const messageContent = `
  > Assigned to You by **${nameUserAssign}**
  > Role: **${mapRoleMember[role]}**
  > Task status: **${nameStatusTask}**
  > Task name: **${dataTask?.name}**
  > Deadline: *${dataTask?.deadline ? formattedDeadline : "No deadline"}*
  > View task: *${notification.link}*
   `;
    try {
      // if (idUserAssign !== userId)
      //   DiscordService.sendMessageToDiscord(messageContent, discordId);
    } catch (error) {
      // console.error('Error sending message to Discord', error);
    }

    return res.json(data);
  })
);

router.post(
  "/tasks/:taskId/unassign",
  asyncHandler(async (req, res) => {
    const taskId = req.params.taskId;
    const userId = req.body.userId;
    const role = req.body.role;
    const data = await TaskService.removeTaskAssignee({ taskId, userId, role });
    return res.json(data);
  })
);

router.get(
  "/tasks/:taskId/assignees",
  asyncHandler(async (req, res) => {
    const taskId = req.params.taskId;
    const data = await TaskService.getTaskAssignees({ taskId });
    return res.json(data);
  })
);

router.get(
  "/tasks/:sprintId/sprintAssignment",
  asyncHandler(async (req, res) => {
    const sprintId = req.params.sprintId;
    const data = await TaskService.getAssigneesBySprintId({ sprintId });
    return res.json(data);
  })
);

// Copy or duplicate tasks
router.post(
  "/tasks/copy",
  asyncHandler(async (req: AuthRequest, res) => {
    const reqBody = req.body as CopyTasksArgs;
    const userId = req?.credentials?.id!;
    if (!reqBody.toSprintId || !reqBody.taskIds?.length)
      throw new BadRequestError();
    const data = await TaskService.copyTasks(reqBody, userId);
    return res.json(data);
  })
);

// Move Tasks
router.post(
  "/tasks/move",
  asyncHandler(async (req: AuthRequest, res) => {
    const reqBody = req.body as CopyTasksArgs;
    const userId = req?.credentials?.id!;

    if (!reqBody.toSprintId || !reqBody.taskIds?.length)
      throw new BadRequestError();
    const data = await TaskService.moveTasks(reqBody, userId);
    return res.json(data);
  })
);
// Get subTask by taskId
router.get(
  "/tasks/:taskId/subTasksByTaskId",
  asyncHandler(async (req, res) => {
    const taskId = req.params.taskId;
    const data = await TaskService.getSubTaskByTaskId({ taskId });
    return res.json(data);
  })
);

router.get(
  "/tasks/:sprintId/subTasksBySprintId",
  asyncHandler(async (req, res) => {
    const sprintId = req.params.sprintId;
    const data = await TaskService.getSubTaskBySprintId({ sprintId });
    return res.json(data);
  })
);


export { router as taskRouter };
