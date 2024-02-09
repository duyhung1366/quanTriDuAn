import { Document, Model, model, Schema } from "mongoose";
import Project from "../../../common/models/project";

export interface ProjectDoc extends Project, Document {
  _id: string;
}

export const projectTbl = "Project";
export const projectTblRef = "projects";

interface _ProjectModel extends Model<ProjectDoc> { }

const projectSchema = new Schema<ProjectDoc, _ProjectModel>({
  name: String,
  description: String,
  deletedAt: Number
}, {
  versionKey: false,
  timestamps: true
});

export const ProjectModel = model(projectTbl, projectSchema);
