import { Document, model, Model, Schema, Types } from "mongoose";
import Task from "../../../common/models/task";
import { projectTbl } from "./project.model";
import { sprintTbl } from "./sprint.model";

export const taskTbl = "Task";

export interface TaskDoc extends Task, Document {
  _id: string;
}

const taskSchema = new Schema<TaskDoc, Model<TaskDoc>>({
  name: String,
  userId: String,
  status: Number,
  statusStage: Number,
  description: String,
  bugDescription: String,
  createDate: Number,
  startDate: Number,
  deadline: Number,
  estimatePoints: Number,
  testEstimatePoints: Number,
  reviewEstimatePoints: Number,
  testActualPoints: Number,
  actualPoints: Number,
  difficulty: Number,
  priority: Number,
  parentId: String,
  checkListItemRefId: String,
  parentTaskId: String,
  isArchived: Boolean,
  originTaskId: String,
  projectId: {
    type: Types.ObjectId,
    ref: projectTbl
  },
  sprintId: {
    type: Types.ObjectId,
    ref: sprintTbl
  },
  attachImage: {
    type: [String],
    default: []
  },
  copiedAt: Number,
  deletedAt: Number
}, {
  versionKey: false,
  timestamps: true
});

export const TaskModel = model(taskTbl, taskSchema);