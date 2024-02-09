

export type CreateProjectCheckListArgs = {
  name: string;
  attachTo: number;
  parentId: any;
  createDate: number;
  items?: Array<any>;
}

class ProjectCheckList {
  _id?: string;
  name: string;
  attachTo: number;
  parentId: any;
  createDate: number;
  items?: Array<{
    _id?: string;
    title: string;
    status: number;
    assignees?: Array<string>;
    desc?: string;
    attachImage?: Array<string>;
    isExistSubtask?: boolean;
  }>

  constructor(args: any = {}) {
    this._id = args._id;
    this.name = args.name;
    this.attachTo = args.attachTo;
    this.parentId = args.parentId;
    this.createDate = args.createDate;
    this.items = args.items;
  }
}

export default ProjectCheckList;