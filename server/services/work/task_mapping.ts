import { SprintStatus, TaskStatus } from "../../../common/constants";
import SocketEvent from "../../../common/socketio/events";
import Notification from "../../../common/models/notification";
import { SprintModel } from "../../database/mongo/sprint.model";
import { TaskModel } from "../../database/mongo/task.model";
import { TaskAssignmentModel } from "../../database/mongo/task_assignment.model";
import DiscordService from "../affiliate/discord";
import ProjectService from "./project";
import moment from "moment";
const { ObjectId } = require('mongodb');

export default class TaskMappingService {
  static async scanTasksDeadline() {
    const listProjects = await ProjectService.listProjects();

    const sprintPromises = listProjects.map(async (project) => {
      const currentSprintActive = await SprintModel.findOne({
        status: SprintStatus.ACTIVE,
        projectId: project._id,
      });
      return { project, currentSprintActive };
    });

    const sprintResults = await Promise.all(sprintPromises);

    const taskPromises = sprintResults.map(async (result) => {
      const { project, currentSprintActive } = result;
      const tasks = await TaskModel.find({
        sprintId: currentSprintActive?._id,
        projectId: project._id,
      });

      const taskAssignmentPromises = tasks.map(async (task) => {
        const now = Date.now();
        const deadline = task.deadline;
        const deadlineMinus2Hours = deadline && deadline - 2 * 60 * 60 * 1000;
        if (
          deadline && deadlineMinus2Hours &&
          deadlineMinus2Hours < now &&
          task.status !== TaskStatus.COMPLETE
        ) {
          const assignment = await TaskAssignmentModel.findOne({
            taskId: task._id,
          });
          if (assignment && !assignment.notified) {
            const updateTaskAssignment = await TaskAssignmentModel.updateOne(
              { taskId: task._id },
              { $set: { missed: true, notified: true } },
              { new: true }
            ).exec();
            const missedTask = await TaskAssignmentModel.findOne({
              taskId: task._id,
              missed: true,
            })
              .populate({ path: 'userId' })
              .populate({ path: "taskId", select: "name status deadline" });
            console.log("missedTask", missedTask);

            const discordId = await missedTask.toObject().userId.discordId;

            if (!discordId) return;
            const formattedDeadline = moment(
              missedTask.taskId?.deadline
            ).format("DD/MM/yyyy, hh:mm a");

            const messageContent = `
                > **Task Overdue**
                > Deadline: *${formattedDeadline}*
                > Task name: **${missedTask.taskId.name}**
                > Task status: **${TaskStatus[missedTask.taskId.status]}**
                > View task: *${process.env.BASE_TASK_URL}/${missedTask.taskId._id}*
              `;
            try {
              DiscordService.sendMessageToDiscord(messageContent, "747813692636266566");
            } catch (error) {
              // console.error('Error sending message to Discord', error);
            }
          }
        }
      });
      await Promise.all(taskAssignmentPromises);
    });
    await Promise.all(taskPromises);
  }
}


// if (
//   deadlineMinus2Hours &&
//   deadlineMinus2Hours < now && task.status !== TaskStatus.COMPLETE
// ) {
//   const findTask = await TaskAssignmentModel.findOne({
//     taskId: task._id,
//   })
//     .populate({ path: "userId", select: "discordId" })
//     .populate({ path: "taskId", select: "name status deadline" });
//   console.log("findTask", findTask);

//   const discordId = findTask.toObject().userId.discordId;

//   if (!discordId) return;
//   const formattedDeadline = moment(
//     findTask.taskId?.deadline
//   ).format("DD/MM/yyyy, hh:mm a");

//   const messageContent = `
//       > **Deadline is comming**
//       > Deadline: *${formattedDeadline}*
//       > Task name: **${findTask.taskId.name}**
//       > Task status: **${TaskStatus[findTask.taskId.status]}**
//       > View task: *${process.env.BASE_TASK_URL}/${findTask.taskId._id}*
//     `;
//   try {
//     DiscordService.sendMessageToDiscord(messageContent, "747813692636266566");
//   } catch (error) {
//     // console.error('Error sending message to Discord', error);
//   }
// }