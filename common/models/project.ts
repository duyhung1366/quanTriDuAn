export interface ICreateProjectArgs {
  name: string;
  description?: string;
  ownerId: string
}

export interface IEditProjectArgs {
  name: string;
  description?: string;
}
export interface IDeleteProjectArgs {
  deletedAt?: number;
}
export default class Project {
  _id?: string;
  name: string;
  description: string;
  deletedAt?: number;

  constructor(args: any = {}) {
    this._id = args._id;
    this.name = args.name;
    this.description = args.description;
    this.deletedAt = args.deletedAt;
  }
}
