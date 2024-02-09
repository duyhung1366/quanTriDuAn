import { ProjectRole } from "../constants";

export interface ICreateProjectMembersArgs {
  projectId: any;
  userId: any;
  role: number;
}
class ProjectMember {
  _id?: string;
  projectId: any;
  userId: any;
  role: number;
  joinedAt: number;
  deletedAt?: number;

  constructor(args: any = {}) {
    this._id = args._id;
    this.projectId = args.projectId;
    this.userId = args.userId;
    this.role = args.role ?? ProjectRole.SPRINT_MEMBER;
    this.joinedAt = args.joinedAt;
    this.deletedAt = args.deletedAt;
  }
}

export default ProjectMember;