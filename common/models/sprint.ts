import { SprintStatus } from "../constants";

export type CreateSprintArgs = {
  name: string;
  description?: string;
  startDate: number;
  endDate: number;
  ownerId: string;
  parentId?: string;
  projectId: string;
  status : number;
}

export enum SprintErrorCode {
  EXISTED_ACTIVE_SPRINT = 1
}

class Sprint {
  _id?: string;
  name: string;
  description: string;
  /** UNIX Timestamp */
  startDate: number;
  /** UNIX Timestamp */
  endDate: number;
  status: number;
  ownerId: any;
  projectId: any;

  constructor(args: any = {}) {
    this._id = args?._id;
    this.name = args.name;
    this.description = args.description;
    this.startDate = args.startDate;
    this.endDate = args.endDate;
    this.status = args.status ?? SprintStatus.UP_COMING;
    this.ownerId = args.ownerId;
    this.projectId = args.projectId;
  }
}

export default Sprint;