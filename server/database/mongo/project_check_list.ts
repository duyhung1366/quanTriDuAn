

import { Document, model, Model, Schema, Types } from "mongoose";
import { TaskStatus } from "../../../common/constants";
import ProjectCheckList from "../../../common/models/project_check_list";
import { sprintTbl } from "./sprint.model";


export const projectCheckListTbl = "ProjectCheckList";

export interface ProjectCheckListDoc extends ProjectCheckList, Document {
  _id: string;
}

const checkListProjectSchema = new Schema<ProjectCheckListDoc, Model<ProjectCheckListDoc>>({
  name: String,
  attachTo: Number,
  parentId: {
    type: Types.ObjectId,
    ref: sprintTbl
  },

  createDate: Number,

  items: [
    {
      title: String,
      status: Number,
      assignees: {
        type: [Types.ObjectId],
        default: []
      },
      desc: String,
      attachImage: {
        type: [String],
        default: []
      },
      isExistSubtask: Boolean,
    }
  ]
}, {
  versionKey: false,
  timestamps: true
});

export const ProjectCheckListModel = model(projectCheckListTbl, checkListProjectSchema);

