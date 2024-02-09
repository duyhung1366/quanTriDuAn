import { Document, Model, model, Schema, Types } from "mongoose";
import Sprint from "../../../common/models/sprint";
import { projectTbl } from "./project.model";

export interface SprintDoc extends Sprint, Document {
  _id: string;
}

export const sprintTbl = "Sprint";
export const sprintTblRef = "sprints";

interface _SprintModel extends Model<SprintDoc> { }

const sprintSchema = new Schema<SprintDoc, _SprintModel>({
  name: String,
  description: String,
  startDate: Number,
  endDate: Number,
  status: Number,
  ownerId: {
    type: Types.ObjectId,
    ref: "User"
  },
  projectId: {
    type: Types.ObjectId,
    ref: projectTbl
  }
}, {
  versionKey: false,
  timestamps: true
});

export const SprintModel = model(sprintTbl, sprintSchema);



