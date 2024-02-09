export enum NotificationStatus {
  NEW = "new",
  READ = "read",
  DELETE = "delete",
}
export interface INotification {
  authorId: string;
  event: string;
  objectId: string;
  description?: string;
  target?: string[];
  createdAt?: number;
  status?: NotificationStatus;
  lastUpdate?: number;
  thumbnailImage?: string;
  link?: string;
}
export default class Notification implements INotification {
  authorId: string; // ID của người tạo ra thông báo
  event: string; // Biểu thị cho các hành động khác nhau để hiển thị thông báo
  objectId: string; // Đại diện cho đối tượng mà hành động thực hiện
  description?: string;
  target?: string[]; // ID của người nhận thông báo
  status?: NotificationStatus;
  thumbnailImage?: string;
  link?: string;
  data?: any;
  // UNIX timestamp
  lastUpdate?: number;
  createdAt: number;

  constructor(authorId: string, event: string, objectId: string) {
    this.authorId = authorId;
    this.event = event;
    this.objectId = objectId;
    this.description = "";
    this.target = [];
    this.status = NotificationStatus.NEW;
    this.thumbnailImage = "";
    this.link = "";
    this.createdAt = new Date().getTime();
    this.lastUpdate = new Date().getTime();
  }
}
