import { LoginCode, TaskRole } from "../../../common/constants";
import Task, { UpdatePositionTaskArgs } from "../../../common/models/task";
import TaskAssignment from "../../../common/models/task_assignment";
import { get, patch, post } from "../utils/request"

export const updatePositionTaskApi = async (taskId: string, args: UpdatePositionTaskArgs) => {
  const res = await patch({ endpoint: `/tasks/updatePositionTask/${taskId}`, body: args });
  return res;
}
export const apiGetSprintAssignment = async (sprintId: string): Promise<Array<TaskAssignment>> => {
  const { data, error } = await get({ endpoint: `/tasks/${sprintId}/sprintAssignment` });
  return error ? [] : data;
}
export const apiGetAllTask = async (args: {
  from: number;
  to: number;
  user_id: string;
  project_ids: string[];
}): Promise<Array<Task>> => {
  const { data, error } = await get({ endpoint: `/tasks/allTask`, params: args });
  return error ? [] : data;
}
export const apiCloneMultipleTask = async (props: { taskIds: string[]; sprintId: string }) => {
  const res = await post({ endpoint: `/tasks/copy`, body: { "taskIds": props.taskIds, "toSprintId": props.sprintId } });
  return res;
}
export const apiMoveMultipleTask = async (props: { taskIds: string[]; sprintId: string }) => {
  const res = await post({ endpoint: `/tasks/move`, body: { "taskIds": props.taskIds, "toSprintId": props.sprintId } });
  return res;
}
export const apiDeleteMultipleTask = async (props: { ids: string[] }) => {
  const res = await post({ endpoint: `/tasks/delete`, body: { "ids": props.ids } });
  return res;
}
export const apiCreateTask = async (props: { task: Task, assignees?: string[] }) => {
  const res = await post({ endpoint: `/tasks`, body: { data: props.task, assignees: props?.assignees } });
  return res;
}
export const apiGetSubTaskBySprintId = async (props: { sprintId: string }) => {
  const res = await get({ endpoint: `/tasks/${props.sprintId}/subTasksBySprintId`, });
  return res;
}

export type CreateTaskAssignmentArgs = {
  taskId: string;
  userId: string;
  role: TaskRole;
  discordId?: string;
  nameUserAssign?: string;
}
export const apiCreateTaskAssignment = async (args: CreateTaskAssignmentArgs): Promise<TaskAssignment | null> => {
  const { taskId, ...payload } = args;
  const { data, error } = await post({ endpoint: `/tasks/${taskId}/assign`, body: payload });
  return error ? null : data;
}