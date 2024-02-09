
import { Document, model, Model, Schema, Types } from "mongoose";
import TaskAssignment from "../../../common/models/task_assignment";
import { projectTbl } from "./project.model";
import { sprintTbl } from "./sprint.model";
import { taskTbl } from "./task.model";
import { userTbl } from "./user.model";

export const taskAssignmentTbl = "TaskAssignment";
export const taskAssignmentRef = "taskassignments";

export interface TaskAssignmentDoc extends TaskAssignment, Document {
  _id: string;
}


const taskAssignmentSchema = new Schema<TaskAssignmentDoc, Model<TaskAssignmentDoc>>({
  taskId: {
    type: Types.ObjectId,
    ref: taskTbl
  },
  userId: {
    type: Types.ObjectId,
    ref: userTbl
  },
  role: Number,
  assignAt: Number,
  missed: Boolean,
  notified: Boolean,
  projectId: {
    type: Types.ObjectId,
    ref: projectTbl
  },
  sprintId: {
    type: Types.ObjectId,
    ref: sprintTbl
  }
}, {
  versionKey: false,
  timestamps: true
});

export const TaskAssignmentModel = model(taskAssignmentTbl, taskAssignmentSchema);