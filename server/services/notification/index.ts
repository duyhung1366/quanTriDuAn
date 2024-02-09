import Notification, { NotificationStatus } from "../../../common/models/notification";
import { NotificationModel } from "../../database/mongo/notification.model";


export default class NotificationService {
  public static async readNotification(notificationId: string) {
    try {
      await NotificationModel.findByIdAndUpdate(notificationId, { $set: { status: NotificationStatus.READ } });
    } catch (error) {
      throw error;
      
    }
  }

  public static async listNotification() {
    const notis = await NotificationModel.find();
    return notis;
  }
}