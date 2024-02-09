import ProjectCheckList, { CreateProjectCheckListArgs } from "../../../common/models/project_check_list";
import Task from "../../../common/models/task";
import { ProjectCheckListModel } from "../../database/mongo/project_check_list";
import { TaskModel } from "../../database/mongo/task.model";




export default class ProjectService {


  static async createProjectCheckList(args: CreateProjectCheckListArgs) {
    const data = { ...args };
    const newProjectCheckList = new ProjectCheckListModel(data);
    newProjectCheckList.save();
    return new ProjectCheckList(newProjectCheckList);
  }

  static async deleteProjectCheckList(args: { id: string }) {
    const { id } = args;
    const projectCheckList = await ProjectCheckListModel.findByIdAndDelete(id, { new: true })
    return projectCheckList;
  }

  static async deleteItemCheckList(args: { projectCheckListId: string, itemId: string }) {
    const { projectCheckListId, itemId } = args;
    const projectCheckList = await ProjectCheckListModel.findOneAndUpdate(
      { _id: projectCheckListId },
      { $pull: { items: { _id: itemId } } },
      { safe: true, multi: false, new: true }
    );
    return projectCheckList;
  }

  static async getProjectCheckList(args: { parentId: string }) {
    const { parentId } = args;
    const projectCheckList = await ProjectCheckListModel.find({ parentId })
    return projectCheckList;
  }
  static async addItemCheckList(args: { id: string, items: any }) {
    const { id, items } = args;
    const sprint = await ProjectCheckListModel.findOneAndUpdate({ _id: id }, { $push: items }, { new: true })
    return sprint;
  }
  static async updateItemCheckList(args: { projectCheckListId: string, itemId: string, update: any }) {
    const { projectCheckListId, itemId, update } = args;
    const itemCheckList = await ProjectCheckListModel.findOneAndUpdate(
      { _id: projectCheckListId, "items._id": itemId },
      {
        $set: {
          "items.$.title": update.title,
          "items.$.status": update.status,
          "items.$.assignees": update.assignees,
          "items.$.desc": update.desc,
          "items.$.attachImage": update.attachImage,
          "items.$.isExistSubtask": update.isExistSubtask,
        }
      },
      { 'new': true }
    )
    const findCheckList = await ProjectCheckListModel.findById({ _id: projectCheckListId, "items._id": itemId }).select('attachTo')
    if (update.status && findCheckList?.attachTo === 1) {
      const updateSubTask = await TaskModel.findOneAndUpdate(
        { checkListItemRefId: itemId, deletedAt: { $exists: false } },
        { status: update.status },
        { 'new': true }
      )

    }

    return itemCheckList;
  }




}