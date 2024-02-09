import { TaskRole } from "../constants";

class TaskAssignment {
  _id?: string;
  taskId: any;
  userId: any;
  role: number;
  assignAt: number;
  missed?: boolean;
  notified?: boolean;
  projectId: any;
  sprintId: any;

  constructor(args: any = {}) {
    this._id = args?._id;
    this.taskId = args.taskId;
    this.userId = args.userId;
    this.role = args.role ?? TaskRole.ASSIGNEE;
    this.assignAt = args.assignAt;
    this.missed = args.missed;
    this.notified = args.notified;
    this.projectId = args.projectId;
    this.sprintId = args.sprintId;
  }
}

export default TaskAssignment;
