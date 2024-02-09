import ProjectMember from "../../../common/models/project_member";
import { get } from "../utils/request"

export const apiGetProjectMembers = async (args: { projectId: string }): Promise<Array<ProjectMember>> => {
  const { projectId } = args;
  const { data, error } = await get({ endpoint: `/projects/${projectId}/members` });
  return error ? [] : data;
}

export const apiGetUserProjects = async (): Promise<Array<ProjectMember>> => {
  const { data, error } = await get({ endpoint: "/user-projects" });
  return error ? [] : data;
}