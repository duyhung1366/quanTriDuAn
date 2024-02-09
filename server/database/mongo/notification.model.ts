import { Document, model, Model, Schema, Types } from "mongoose";
import Notification from "../../../common/models/notification";
import { userTbl } from "./user.model";

export const notification = "Notification";
export interface NotificationDoc extends Notification, Document {
  _id: string;
}

interface _NotificationDocModel extends Model<NotificationDoc> {}

const notificationModel = new Schema<NotificationDoc, _NotificationDocModel>(
  {
    authorId: String,
    event: String,
    objectId: String,
    status: String,
    target: { type: [String], default: [] },
    link: String,
    thumbnailImage: String,
    createdAt: Number,
    lastUpdate: Number,
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const NotificationModel = model(notification, notificationModel);
