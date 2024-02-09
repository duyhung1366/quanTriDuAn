import mongoose, { ObjectId, Types } from "mongoose";
import { io } from "../..";
import { TaskRole, TaskStatus } from "../../../common/constants";
import Project from "../../../common/models/project";
import Sprint from "../../../common/models/sprint";
import Task from "../../../common/models/task";
import TaskAssignment from "../../../common/models/task_assignment";
import { NotificationDoc, NotificationModel } from "../../database/mongo/notification.model";
import { projectTblRef } from "../../database/mongo/project.model";
import { ProjectCheckListDoc, ProjectCheckListModel } from '../../database/mongo/project_check_list';
import { sprintTblRef } from "../../database/mongo/sprint.model";
import { TaskDoc, TaskModel } from "../../database/mongo/task.model";
import {
  TaskAssignmentDoc,
  TaskAssignmentModel,
  taskAssignmentRef
} from "../../database/mongo/task_assignment.model";
import { isValidObjectId } from "../../database/mongo/utils";
import { mapStatusTask } from "../../routes/work/task";
import { BadRequestError } from "../../utils/errors";
import DiscordService from "../affiliate/discord";
import { UserModel } from "../../database/mongo/user.model";


export type ListTasksArgs = {
  projectId: string;
  sortOrder?: "desc" | "asc";
  parentId?: string;
  skip?: number;
  limit?: number;
  status?: number;
};

export type CopyTasksArgs = {
  taskIds: string[];
  toSprintId: string;
};

export default class TaskService {
  static mapCurrentUserTyping: { [taskId: string]: string } = {};
  public static getCurrentUserTyping(taskId: string) {
    return this.mapCurrentUserTyping[taskId];
  }
  public static setCurrentUserTyping(taskId: string, userId: string) {
    this.mapCurrentUserTyping[taskId] = userId;
  };
  static async listAllTask(args: {
    from: number;
    to: number;
    userId?: string;
    projectIds?: string[];
  }) {
    const {
      from,
      to,
      userId,
      projectIds
    } = args;
    if (from <= 0 || to <= 0 || from >= to) return [];
    const matchTaskFilter: any = {
      deletedAt: { $exists: false },
      $or: [
        { createdAtDate: { $gte: from, $lte: to } },
        { startDate: { $gte: from, $lte: to } },
        { deadline: { $gte: from, $lte: to } }
      ],
      parentTaskId: null
    };
    if (!!projectIds) {
      matchTaskFilter.projectId = { $in: projectIds.map((e) => new mongoose.Types.ObjectId(e)) }
    }
    let query = TaskModel
      .aggregate<Task & {
        project?: Project;
        sprint?: Sprint;
        subTasks?: Array<Task & { taskAssignments?: Array<{ userId: string, role: TaskRole }> }>;
        taskAssignments?: Array<{ userId: string, role: TaskRole }>;
      }>()
      .addFields({
        createdAtDate: { $toLong: "$createdAt" },
        startDate: { $toLong: "$startDate" },
        deadline: { $toLong: "$deadline" }
      })
      .match(matchTaskFilter)
      .lookup({
        from: projectTblRef,
        let: { projectId: "$projectId" },
        pipeline: [
          {
            $match: { $expr: { $eq: ["$$projectId", "$_id"] }, deletedAt: { $exists: false } },
          },
          {
            $project: { name: 1, _id: 0 }
          }
        ],
        as: "project"
      })
      .unwind({ path: "$project", preserveNullAndEmptyArrays: false })
      .lookup({
        from: sprintTblRef,
        let: { sprintId: "$sprintId" },
        pipeline: [
          {
            $match: { $expr: { $eq: ["$$sprintId", "$_id"] }, deletedAt: { $exists: false } },
          },
          {
            $project: { name: 1, _id: 0 }
          }
        ],
        as: "sprint"
      })
      .unwind({ path: "$sprint", preserveNullAndEmptyArrays: false })
      .lookup({
        from: "taskassignments",
        let: { taskId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$$taskId", "$taskId"] } } },
          { $project: { userId: 1, role: 1, _id: 0 } }
        ],
        as: "taskAssignments"
      })
      .lookup({
        from: "tasks",
        let: { taskId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: [{ $toString: "$$taskId" }, "$parentTaskId"] }
            }
          },
          {
            $lookup: {
              from: "taskassignments",
              let: { taskId: "$_id" },
              pipeline: [
                { $match: { $expr: { $eq: ["$$taskId", "$taskId"] } } },
                { $project: { userId: 1, role: 1, _id: 0 } }
              ],
              as: "taskAssignments"
            }
          }
        ],
        as: "subTasks"
      });
    if (!!userId) {
      query = query.match({
        "taskAssignments.userId": new mongoose.Types.ObjectId(userId)
      })
    }
    const tasks = await query;
    const taskGroups = tasks.reduce((groups, task) => {
      if (task.originTaskId) {
        if (!groups[task.originTaskId]) {
          groups[task.originTaskId] = [];
        }
        groups[task.originTaskId].push(task);
      } else if (task._id) {
        if (!groups[task._id]) {
          groups[task._id] = [];
        }
        groups[task._id].push(task);
      }
      return groups;
    }, {});
    const data = Object.values(taskGroups).map((taskGroup: any) => {
      taskGroup.sort((a, b) => {
        const aDate = a.copiedAt;
        const bDate = b.copiedAt;
        if (!aDate && bDate) return 1;
        if (aDate && !bDate) return -1;
        return Math.abs(Date.now() - aDate) - Math.abs(Date.now() - bDate);
      });
      return taskGroup[0];
    });
    // const data = selectedTasks.map((e) => {
    //   return {
    //     ...e,
    //     assignments: e.taskAssignments?.map((e) => e)
    //   }
    // })
    return data;
  }
  static async listTasks(args: ListTasksArgs) {
    // console.log("args task", args);

    const {
      projectId,
      sortOrder = "desc",
      skip = 0,
      // limit = 10,
      status,
    } = args;
    if (!projectId) return [];
    const filters: any = {
      projectId: new mongoose.Types.ObjectId(projectId),
      deletedAt: { $exists: false },
      parentTaskId: null
    };
    if (typeof status !== "undefined") filters.status = status;
    const tasks = await TaskModel.aggregate()
      .match(filters)
      .lookup({
        from: taskAssignmentRef,
        as: "assignments",
        localField: "_id",
        foreignField: "taskId",
      })
      .sort({ createDate: sortOrder === "desc" ? -1 : 1 })
      .skip(skip);
    // .find(filters)
    // .sort({ createDate: sortOrder === "desc" ? -1 : 1 })
    // .skip(skip)
    // .find({ deletedAt: { $exists: false } })
    // .limit(limit);

    // return sprints.map((e) => new Task(e));

    return tasks;
  }

  // static async createTask(args: Task) {
  //   const data = { ...args };
  //   const newTask = new TaskModel(data);
  //   newTask.save();
  //   return new Task(newTask);
  // }

  static async createTask(props: { task: Task, assignees?: string[], userId: string }) {
    const { task, assignees, userId } = props
    const { sprintId, projectId } = task
    const newTask = new TaskModel(task);
    newTask.save();

    const notification: NotificationDoc = new NotificationModel({
      event: 'TaskAssigned',
      description: `${task?.name}`,
      link: `${process.env.BASE_TASK_URL}/${newTask._id}`,
      createdAt: Date.now(),
    });
    const result = await UserModel.findById({ _id: userId }).select("name")
    const messageContent = `
    > Assigned to You by **${result?.name}**
    > Role: ** "ASSIGNEE"**
    > Task status: **${mapStatusTask[task.status]}**
    > Task name: **${task?.name}**
    > View task: *${notification.link}*
     `;
    if (!!assignees && assignees.length > 0) {
      const taskAssignments = assignees.map(userId => ({
        taskId: newTask._id,
        sprintId,
        projectId,
        userId,
        role: TaskRole.ASSIGNEE,
        assignAt: Date.now()
      }));
      await TaskAssignmentModel.insertMany(taskAssignments);

      const userPromises = assignees.map(async (userId) => {
        try {
          const result = await UserModel.findById({ _id: userId }).select("discordId");
          if (result) {
            return DiscordService.sendMessageToDiscord(messageContent, result.discordId);
          }
        } catch (error) {
          // console.error('Error sending message to Discord', error);
        }
      });

      await Promise.all(userPromises);
    }
    return new Task(newTask);
  }

  static async updateTask(
    taskId: string,
    args: Partial<Omit<Task, "_id">>,
    userId: string
    // userTyping: string,
    // cancelTyping: boolean
  ) {
    const data = { ...args };

    // const task = TaskModel.updateOne({ _id: taskId }, data);
    const previousTask = await TaskModel.findById(taskId);
    const taskAssignment = await TaskAssignmentModel.find({ taskId, userId: { $ne: userId } }).populate("userId", "discordId")
    const user = await UserModel.findById({ _id: userId }).select('name')
    const statusPreviousTask = previousTask?.status;
    const task = await TaskModel.findByIdAndUpdate(
      taskId,
      { $set: data },
      { new: true }
    );

    if (data?.name) {
      io.updateNameTask({ task: new Task(task) });
    }

    if (data.status && previousTask?.checkListItemRefId) {
      const itemCheckList = await ProjectCheckListModel.findOneAndUpdate(
        {
          "items._id": previousTask.checkListItemRefId,
          "items.status": { $ne: data.status }
        },
        {
          $set: {
            "items.$.status": data.status
          }
        },
        { new: true }
      );

    }

    if (typeof task?.status !== "undefined" && task.status !== statusPreviousTask) {

      taskAssignment.forEach((item) => {
        const discordId = item.toObject().userId?.discordId

        const notification: NotificationDoc = new NotificationModel({
          event: `ChangeStatus`,
          description: `${mapStatusTask[task.status]}`,
          link: `*${process.env.BASE_TASK_URL}/${taskId}*`,
          lastUpdate: Date.now(),
        });
        const messageContent = `
        > **${user?.name}** changed status **${mapStatusTask[statusPreviousTask!]}  ->  ${mapStatusTask[task.status]}**
        > Task name: **${task.name}**
        > View task: *${notification.link}*
        `;
        try {
          DiscordService.sendMessageToDiscord(messageContent, discordId)
        } catch (error) {
          // console.error('Error sending message to Discord', error);
        }
      })
    }
    return task;
  }

  static async updatePositionTask(
    taskId: string,
    childCurrentTaskId: string | null,
    childDestinationTaskId: string | null,
    parentDestinationTaskId: string | null,
    args: Partial<Task>
  ) {
    const data = { ...args } as Partial<Task>;
    const input: Partial<Task> = {
      status: data.status,
    };
    const currentTask = await TaskModel.findOne({ _id: taskId });
    if (!currentTask) {
      throw new BadRequestError();
    }
    const session = await mongoose.startSession();
    const response: Array<Task> = [];
    await session.withTransaction(async () => {
      let task: Task | null;
      if (childCurrentTaskId) {
        if (currentTask.parentId) {
          task = await TaskModel.findOneAndUpdate(
            { _id: childCurrentTaskId },
            { parentId: currentTask.parentId },
            { new: true }
          );
          task && response.push(task);
        } else {
          task = await TaskModel.findOneAndUpdate(
            { _id: childCurrentTaskId },
            { parentId: null },
            { new: true }
          );
          task && response.push(task);
        }
      }
      if (childDestinationTaskId) {
        task = await TaskModel.findOneAndUpdate(
          { _id: childDestinationTaskId },
          { parentId: taskId },
          { new: true }
        );
        task && response.push(task);
      }
      task = await TaskModel.findOneAndUpdate(
        { _id: taskId },
        { parentId: parentDestinationTaskId, ...input },
        { new: true }
      );
      task && response.push(task);
    });


    session.endSession();
    const [task] = response.slice(-1);
    io.updateStatusTask({ task: new Task(task) });
    return response.map((item) => new Task(item));
  }
  static async getTaskById(taskId: string) {
    const task = await TaskModel.findById({ _id: taskId });
    if (task) {
      return task;
    }
    return null;
  }
  static async deleteTask(args: { id: string }) {
    const { id } = args;
    const task = await TaskModel.findByIdAndUpdate(
      { _id: id },
      { $set: { deletedAt: Date.now() } },
      { new: true }
    );
    if (task) {
      io?.deleteTask({ task })
    }
    return task;
  }

  static async deleteMultipleTask(args: { ids: string[] }) {
    const { ids } = args;
    const tasks = await TaskModel.updateMany(
      { _id: { $in: ids } },
      { $set: { deletedAt: Date.now() } }
    );
    if (tasks.modifiedCount > 0) {
      io?.deleteMultipleTask({ ids })
    }
    return tasks;
  }

  // assign members
  static async assignUserToTask(args: {
    taskId: string;
    userId: string;
    role: TaskRole;
    from: string;
  }) {
    const { from, taskId, userId, role } = args;
    const task = await TaskModel.findById(taskId).select(
      "projectId sprintId name"
    );
    if (!task) return null;
    const timeNow = Date.now();
    const taskAssignment = await TaskAssignmentModel.findOneAndUpdate(
      { taskId, userId, role },
      {
        $set: { assignAt: timeNow },
        $setOnInsert: { projectId: task.projectId, sprintId: task.sprintId },
      },
      { new: true, upsert: true }
    );

    if (from !== userId) {
      io.assignUserToTask({ task, from, to: userId, role });
    }

    return taskAssignment;
  }

  static async assignMultipleToTask(assigns: TaskAssignment[]) {
    const multipleAssign = await TaskAssignmentModel.insertMany(assigns);
    return multipleAssign;
  }

  static async getTaskAssignees(args: { taskId: string }) {
    const taskAssignees = await TaskAssignmentModel.find({
      taskId: args.taskId,
    });
    return taskAssignees;
  }
  static async getAssigneesBySprintId(args: { sprintId: string }) {
    const taskAssignees = await TaskAssignmentModel.find({
      sprintId: args.sprintId,
    });
    return taskAssignees;
  }

  static async removeTaskAssignee(args: {
    userId: string;
    taskId: string;
    role: TaskRole;
  }) {
    const deleted = await TaskAssignmentModel.findOneAndDelete(args);
    return deleted;
  }

  static async copyTasks(args: CopyTasksArgs, userId: string) {
    const { taskIds, toSprintId } = args;
    const tasksReturnList: any[] = [];
    if (
      taskIds.some((id) => !isValidObjectId(id)) ||
      !isValidObjectId(toSprintId)
    )
      return {
        tasks: [],
        taskAssignments: [],
      };
    const dataTasks = await TaskModel.find({
      _id: { $in: taskIds },
      deletedAt: { $exists: false },
    });
    const dataTaskAssignments = await TaskAssignmentModel.find({
      taskId: { $in: taskIds },
    });

    const dataCheckList = await ProjectCheckListModel.find({
      parentId: { $in: taskIds },
    });
    const newTasks: TaskDoc[] = [];
    const newTaskAssignments: TaskAssignmentDoc[] = [];
    const newCheckList: ProjectCheckListDoc[] = [];
    const timeNow = Date.now();

    dataTasks.forEach((taskDoc) => {
      const { _id, sprintId, ...dataNewTask } = taskDoc.toObject();
      const newTask = new TaskModel({
        ...dataNewTask,
        sprintId: toSprintId,
        originTaskId: _id,
        copiedAt: new Date()

      });

      const checkLists = dataCheckList
        .filter((e) => {
          return String(e.parentId) === String(taskDoc._id)
        })
        .map((e) => {
          const { _id, parentId, ...dataNewCheckList } = e.toObject();
          const filterItems = dataNewCheckList.items?.filter((item) => item.status !== TaskStatus.COMPLETE);
          return new ProjectCheckListModel({
            ...dataNewCheckList,
            items: filterItems,
            parentId: newTask._id
          })
        })

      const taskAssignments = dataTaskAssignments
        .filter((e) => String(e.taskId) === String(taskDoc._id))
        .map((e) => {
          const { _id, ...dataNewTaskAssignment } = e.toObject();
          return new TaskAssignmentModel({
            ...dataNewTaskAssignment,
            taskId: newTask._id,
            assignAt: timeNow,
            sprintId: toSprintId,
          });
        });
      newTasks.push(newTask);
      newTaskAssignments.push(...taskAssignments);
      newCheckList.push(...checkLists)
      const newObject = Object.assign(newTask.toObject(), {
        assignments: newTaskAssignments,
        createdAt: new Date(),
      });
      tasksReturnList.push(newObject);
    });

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await TaskModel.insertMany(newTasks, { session });
      await TaskAssignmentModel.insertMany(newTaskAssignments, { session });
      await ProjectCheckListModel.insertMany(newCheckList, { session });
      await session.commitTransaction();
      io.cloneTasks({ data: tasksReturnList, userId })
    } catch (error) {
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
    return tasksReturnList;

    // return {
    //   tasks: newTasks,
    //   taskAssignments: newTaskAssignments
    // }
  }

  static async moveTasks(args: CopyTasksArgs, userId: string) {
    const { taskIds, toSprintId } = args;
    const tasksReturnList: any[] = [];
    const tasksUpdated: any[] = [];
    if (
      taskIds.some((id) => !isValidObjectId(id)) ||
      !isValidObjectId(toSprintId)
    )
      return {
        tasks: [],
        taskAssignments: [],
      };
    const dataTasks = await TaskModel.find({
      _id: { $in: taskIds },
      deletedAt: { $exists: false },
    });
    const dataTaskAssignments = await TaskAssignmentModel.find({
      taskId: { $in: taskIds },
    });

    const dataCheckList = await ProjectCheckListModel.find({
      parentId: { $in: taskIds },
    });

    const newTasks: TaskDoc[] = [];
    const newTaskAssignments: TaskAssignmentDoc[] = [];
    const newCheckList: ProjectCheckListDoc[] = [];
    const timeNow = Date.now();
    dataTasks.forEach(async (taskDoc) => {
      const { _id, sprintId, ...dataNewTask } = taskDoc.toObject();
      if (taskDoc.isArchived) {
        delete dataNewTask.isArchived;
      }
      const newTask = new TaskModel({
        ...dataNewTask,
        sprintId: toSprintId,
      });

      const checkLists = dataCheckList
        .filter((e) => {
          return String(e.parentId) === String(taskDoc._id)
        })
        .map((e) => {
          const { _id, parentId, ...dataNewCheckList } = e.toObject();
          const filterItems = dataNewCheckList.items?.filter((item) => item.status !== TaskStatus.COMPLETE);
          return new ProjectCheckListModel({
            ...dataNewCheckList,
            items: filterItems,
            parentId: newTask._id
          })
        })

      const taskAssignments = dataTaskAssignments
        .filter((e) => String(e.taskId) === String(taskDoc._id))
        .map((e) => {
          const { _id, ...dataNewTaskAssignment } = e.toObject();
          return new TaskAssignmentModel({
            ...dataNewTaskAssignment,
            taskId: newTask._id,
            assignAt: timeNow,
            sprintId: toSprintId,
          });
        });
      newTasks.push(newTask);
      newTaskAssignments.push(...taskAssignments);
      newCheckList.push(...checkLists)
      const newObject = Object.assign(newTask.toObject(), {
        assignments: newTaskAssignments,
        createdAt: new Date(),
      });
      tasksReturnList.push(newObject);
      const updatedTask = await TaskModel.findByIdAndUpdate(
        taskDoc._id,
        {
          $set: { isArchived: true },
        },
        { new: true }
      );
      tasksUpdated.push(updatedTask)
    });
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await TaskModel.insertMany(newTasks, { session });
      await TaskAssignmentModel.insertMany(newTaskAssignments, { session });
      await ProjectCheckListModel.insertMany(newCheckList, { session });
      await session.commitTransaction();
      io.moveTasks({ data: tasksReturnList, tasksUpdated, userId })
    } catch (error) {
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
    return { tasksReturnList, tasksUpdated };

    // const { taskIds, toSprintId } = args;
    // if (
    //   taskIds.some((id) => !isValidObjectId(id)) ||
    //   !isValidObjectId(toSprintId)
    // )
    //   return false;
    // const session = await mongoose.startSession();
    // session.startTransaction();
    // let success = false;
    // try {
    //   await TaskModel.updateMany(
    //     { _id: { $in: taskIds } },
    //     { $set: { sprintId: toSprintId, createdAt: new Date() } },
    //     { session }
    //   );
    //   await TaskAssignmentModel.updateMany(
    //     { taskId: { $in: taskIds } },
    //     { $set: { sprintId: toSprintId, assignAt: Date.now() } },
    //     { session }
    //   );
    //   // await ProjectCheckListModel.updateMany(
    //   //   {
    //   //     parentId: { $in: taskIds },
    //   //   },
    //   //   {
    //   //     $pull: { items: { status: TaskStatus.COMPLETE } }
    //   //   },
    //   //   { session }
    //   // );
    //   await session.commitTransaction();
    //   io.moveTasks({ taskIds, toSprintId, userId })
    //   success = true;
    // } catch (error) {
    //   await session.abortTransaction();
    // } finally {
    //   session.endSession();
    // }
    // return success;
  }

  static async getSubTaskByTaskId(args: { taskId: string }) {
    const subTasks = await TaskModel.find({
      parentTaskId: args.taskId,
      deletedAt: { $exists: false }
    });
    return subTasks;
  }
  static async getSubTaskBySprintId(args: { sprintId: string }) {
    const subTasks = await TaskModel.find({
      parentTaskId: { $ne: null } as any,
      sprintId: args.sprintId,
      deletedAt: { $exists: false }
    });
    return subTasks;
  }


}
