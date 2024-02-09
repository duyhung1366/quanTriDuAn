import { Types } from "mongoose";
import { io } from "../..";
import { ProjectRole } from "../../../common/constants";
import Notification from "../../../common/models/notification";
import Project, { ICreateProjectArgs, IEditProjectArgs } from "../../../common/models/project";
import SocketEvent from "../../../common/socketio/events";
import { ProjectModel } from "../../database/mongo/project.model";
import { ProjectMemberModel } from "../../database/mongo/project_member.model";
import { isValidObjectId } from "../../database/mongo/utils";
// import { UpdateTitleProject } from "../../socketio";

export default class ProjectService {
  // Projects
  static async createProject(args: ICreateProjectArgs) {
    const { name, description = '', ownerId } = args;
    const newProject = new ProjectModel({ name, description });
    newProject.save();
    const projectId = newProject.toJSON()._id;
    const userId = ownerId;
    const role = ProjectRole.OWNER;
    await ProjectMemberModel.findOneAndUpdate(
      { projectId, userId },
      { $set: { role }, $setOnInsert: { joinedAt: Date.now() } },
      { new: true, upsert: true }
    );
    return new Project(newProject.toJSON());
  }

  static async listProjects() {
    const projects = await ProjectModel.find({ deletedAt: { $exists: false } });
    return projects.map((e) => new Project(e));
  }
  static async getProjectById(projectId: string) {
    const project = await ProjectModel.findOne({ _id: projectId });
    if (project) {
      return new Project(project);
    }
    return null;
  }
  static async updateProject(projectId: string, args: IEditProjectArgs) {
    const project = await ProjectModel.findByIdAndUpdate(projectId, { $set: { name: args.name, description: args.description } }, { new: true });
    ///// Notification //////
    // io.updateTitleProject({ project: new Project(project) })

    // const projectMember = await ProjectMemberModel.findOne({ projectId: projectId });
    // const noti: Notification = new Notification("none");
    // // noti.description = "aloalo";
    // noti.event = SocketEvent.PROJECT_UPDATE_TITLE;
    // io.emitNotification("/notification", SocketEvent.PROJECT_UPDATE_TITLE, noti, ["61c81f0e4a6e05e46606dc72"]);
    return new Project(project);
  }
  static async deleteProject(projectId: string) {

    const project = await ProjectModel.findByIdAndUpdate({ _id: projectId }, { $set: { deletedAt: Date.now() } }, { new: true });
    return project;
  }
  static async addOrUpdateProjectMember(args: { projectId: string; userId: string; role?: ProjectRole }) {
    const { projectId, userId, role = ProjectRole.SPRINT_MEMBER } = args;
    const projectMember = await ProjectMemberModel.findOneAndUpdate(
      { projectId, userId },
      { $set: { role }, $unset: { deletedAt: "" }, $setOnInsert: { joinedAt: Date.now() } },
      { new: true, upsert: true }
    );
    return projectMember;
  }
  static async getProjectMembers(args: { projectId: string }) {
    const projectMembers = await ProjectMemberModel.find({ projectId: args.projectId, deletedAt: { $exists: false } });
    return projectMembers;
  }
  static async removeProjectMember(projectMemberId: string) {
    return ProjectMemberModel.findByIdAndUpdate(projectMemberId, { $set: { deletedAt: Date.now() } }, { new: true });
  }
  static async getUserProjects(args: { userId: string; }) {
    // const projectMembers = await ProjectMemberModel.find({ userId: args.userId });
    const projectMembers = await ProjectMemberModel
      .aggregate()
      .match({ userId: new Types.ObjectId(args.userId), deletedAt: { $exists: false } })
      .lookup({
        from: "projects",
        let: { projectId: "$projectId" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$$projectId", "$_id"] },
              deletedAt: { $exists: false }
            }
          }
        ],
        as: "project"
      })
      .unwind({ path: "$project", preserveNullAndEmptyArrays: false })
      .project({ project: 0 })
    return projectMembers;
  }
}