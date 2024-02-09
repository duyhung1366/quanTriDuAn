import { Document, model, Model, Schema, Types } from "mongoose";
import { ProjectRole } from "../../../common/constants";
import ProjectMember from "../../../common/models/project_member";
import { projectTbl } from "./project.model";
import { userTbl } from "./user.model";

export const projectMemberTbl = "ProjectMember";

export interface ProjectMemberDoc extends ProjectMember, Document {
  _id: string;
}

interface _ProjectMemberModel extends Model<ProjectMemberDoc> { };

const projectMemberSchema = new Schema<ProjectMemberDoc, _ProjectMemberModel>({
  projectId: {
    type: Types.ObjectId,
    ref: projectTbl
  },
  userId: {
    type: Types.ObjectId,
    ref: userTbl
  },
  deletedAt: Number,
  role: {
    type: Number,
    default: ProjectRole.SPRINT_MEMBER
  },
  joinedAt: Number
}, {
  versionKey: false,
  timestamps: true
});

export const ProjectMemberModel = model(projectMemberTbl, projectMemberSchema);
