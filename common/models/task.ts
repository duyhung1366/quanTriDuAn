import { TaskDifficulty, TaskPriority, TaskStatus, TaskStatusStage } from "../constants";


export type UpdatePositionTaskArgs = Partial<Task> & {
  childCurrentTaskId: string | null;
  childDestinationTaskId: string | null;
  parentDestinationTaskId: string | null;
}
export default class Task {
  _id?: string;
  name: string;
  userId: string;
  status: number;
  statusStage?: number;
  description?: string;
  // userTyping ?: string | null;
  bugDescription?: string;
  createDate: number;
  startDate?: number;
  deadline?: number;
  estimatePoints?: number;
  testEstimatePoints?: number;
  reviewEstimatePoints?: number;
  testActualPoints?: number;
  actualPoints?: number;
  difficulty?: number;
  priority?: number;
  projectId: any;
  sprintId: any;
  // field này để sắp xếp thứ tự task theo status thay cho status index
  //////////////////////////
  parentId?: string | null;
  /////////////////////////
  parentTaskId: string;
  checkListItemRefId?: string | null;
  isArchived?: boolean;
  originTaskId?: string;
  attachImage?: string[];
  deletedAt?: number;
  createdAt?: Date;
  copiedAt?: Date;
  updatedAt?: Date;

  constructor(args: any = {}) {
    this._id = args?._id;
    this.name = args?.name;
    this.userId = args?.userId;
    this.status = args?.status ?? TaskStatus.OPEN;
    this.statusStage = args?.statusStage;
    this.description = args?.description;
    this.bugDescription = args?.bugDescription;
    this.createDate = args?.createDate;
    this.startDate = args?.startDate;
    this.deadline = args?.deadline;
    this.estimatePoints = args?.estimatePoints;
    this.testEstimatePoints = args?.testEstimatePoints;
    this.reviewEstimatePoints = args?.reviewEstimatePoints;
    this.testActualPoints = args?.testActualPoints;
    this.actualPoints = args?.actualPoints;
    this.difficulty = args?.dificulty;
    this.priority = args?.priority;
    this.isArchived = args?.isArchived;
    this.projectId = args.projectId;
    this.sprintId = args.sprintId;
    this.parentId = args.parentId;
    this.checkListItemRefId = args.checkListItemRefId;
    this.parentTaskId = args.parentTaskId;
    this.originTaskId = args.originTaskId;
    this.copiedAt = args.copiedAt;
    this.attachImage = args.attachImage;
    this.deletedAt = args.deletedAt;
  }
}