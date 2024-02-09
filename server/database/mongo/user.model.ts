import { model, Model, Schema } from "mongoose";
import User from "../../../common/models/user";

interface UserDoc extends User, Document {
  _id: string;
}

const userSchema = new Schema<UserDoc, Model<UserDoc>>({
  account: {
    type: String, lowercase: true
  },
  name: String,
  password: String,
  avatar: String,
  email: String,
  phoneNumber: String
}, {
  versionKey: false, timestamps: true
});

export const userTbl = "User";

export const UserModel = model(userTbl, userSchema);

