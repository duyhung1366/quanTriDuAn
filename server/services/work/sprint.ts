import { SprintStatus } from "../../../common/constants";
import Sprint, {
  CreateSprintArgs,
  SprintErrorCode,
} from "../../../common/models/sprint";
import SocketEvent from "../../../common/socketio/events";
import { SprintModel } from "../../database/mongo/sprint.model";
import Notification from "../../../common/models/notification";
import { io } from "../..";
import { notification } from "../../database/mongo/notification.model";
import TaskMappingService from "./task_mapping";
import moment from "moment";

export type ListSprintsArgs = {
  projectId: string;
  sortOrder?: "desc" | "asc";
  parentId?: string;
  skip?: number;
  limit?: number;
  status?: number;
  loadCurrent?: boolean;
};

export default class SprintService {
  // Sprints
  static async createSprint(args: CreateSprintArgs) {
    const data = { ...args };
    if (!data.name) {
      const countSprints = await SprintModel.countDocuments({
        projectId: args.projectId,
      });
      data.name = `Sprint ${countSprints + 1}`;
    }
    if (data.status === SprintStatus.ACTIVE) {
      const existsActiveSprintCount = await SprintModel.countDocuments({
        projectId: data.projectId,
        status: SprintStatus.ACTIVE,
      });
      if (existsActiveSprintCount > 0)
        return { errorCode: SprintErrorCode.EXISTED_ACTIVE_SPRINT };
    }
    const newSprint = new SprintModel(data);
    newSprint.save();
    const noti: Notification = new Notification(
      "none",
      SocketEvent.CREATE_SPRINT,
      "none"
    );
    noti.data = { newSprint };
    noti.description = "Done";
    io.emitNotification(
      "/notification",
      SocketEvent.CREATE_SPRINT,
      noti,
      "all"
    );
    return new Sprint(newSprint);
    // const IsStatusActive = await SprintModel.find({ status : SprintStatus.ACTIVE , projectId :data.projectId })
    //  if( IsStatusActive.length === 0 || (IsStatusActive.length > 0 && data.status !== SprintStatus.ACTIVE)){
    //   const newSprint = new SprintModel(data);
    //   newSprint.save();
    //   return new Sprint(newSprint);
    //  }
    //  throw new BadRequestError()
  }

  static async deleteSprint(args: { id: string }) {
    const { id } = args;
    const sprint = await SprintModel.findByIdAndDelete(id, { new: true });
    const noti: Notification = new Notification(
      "none",
      SocketEvent.DELETE_SPRINT,
      id
    );
    noti.data = { sprint };

    io.emitNotification(
      "/notification",
      SocketEvent.DELETE_SPRINT,
      noti,
      "all"
    );
    return sprint;
  }
  static async updateSprint(args: { id: string; update: any }) {
    const { id, update } = args;

    const currentSprintActive = await SprintModel.findOne({
      status: SprintStatus.ACTIVE,
      projectId: update.projectId,
    });
    // console.log("currentSprintActive", currentSprintActive);

    if (
      update.status === SprintStatus.ACTIVE &&
      currentSprintActive?._id === id
    ) {
      return { errorCode: SprintErrorCode.EXISTED_ACTIVE_SPRINT };
    }
    const sprint = await SprintModel.findByIdAndUpdate(id, update, {
      new: true,
    });

    const noti: Notification = new Notification(
      "none",
      SocketEvent.SPRINT_UPDATE,
      id
    );
    noti.data = { sprint };

    io.emitNotification(
      "/notification",
      SocketEvent.SPRINT_UPDATE,
      noti,
      "all"
    );

    //test scan tasks deadline
    TaskMappingService.scanTasksDeadline()

    return sprint;
    // }
    // throw new BadRequestError()
  }
  static async listSprints(args: ListSprintsArgs) {
    const {
      projectId,
      sortOrder = "desc",
      parentId = null,
      skip = 0,
      // limit = 10,
      status,
      loadCurrent // flag 
    } = args;
    if (!projectId) return [];
    const filters: any = {
      projectId,
      parentId,
    };
    if (typeof status !== "undefined") filters.status = status;

    // Neu loadCurrent = true, filters = {}
    // lay thơi gian 1 thang
    // const startOfMonth = moment().startOf("month").valueOf();
    // const endOfMonth = moment().endOf("month").valueOf();
    /**
     * if (typeof status !== "undefined") {
     *  if (status === SprintStatus.ARCHIVED) {
     *     filters.$or = [
     *       { startDate: { $gte: startOfMonth, $lte: endOfMonth }  },
     *      { endDate: { $gte: startOfMonth, $lte: endOfMonth } }
     *    ]
     *  }
     * } else {
     *  // Khong co status truyen len.
     *  filters.$or = [
     *    { status: { $ne: SprintStatus.ARCHIVED } },
     *   { startDate: { $gte: startOfMonth, $lte: endOfMonth }  },
     *     { endDate: { $gte: startOfMonth, $lte: endOfMonth } }
     *  ]
     * }
     */
    const startOfMonth = moment().subtract(1, "month").startOf("month").valueOf();
    const endOfMonth = moment().endOf("month").valueOf();

    if (loadCurrent) {
      if (typeof status !== "undefined") {
        if (status === SprintStatus.ARCHIVED) {
          filters.$or = [
            { startDate: { $gte: startOfMonth, $lte: endOfMonth } },
            { endDate: { $gte: startOfMonth, $lte: endOfMonth } }
          ]
        }
      } else {
        filters.$or = [
          { status: { $ne: SprintStatus.ARCHIVED } },
          { startDate: { $gte: startOfMonth, $lte: endOfMonth } },
          { endDate: { $gte: startOfMonth, $lte: endOfMonth } }
        ]
      }
    }

    const sprints = await SprintModel.find(filters)
      .sort({ createDate: sortOrder === "desc" ? -1 : 1 })
      .skip(skip);
    // .limit(limit);
    return sprints.map((e) => new Sprint(e));
  }
}
