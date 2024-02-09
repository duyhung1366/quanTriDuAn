import dotenv from "./dotenv";
import mongoose, { ConnectOptions } from "mongoose";
import logger from "./logger";
dotenv.config();

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = '27017',
  DB_USER = '',
  DB_PWD = '',
  DB_NAME,
  DB_CLUSTER,
} = process.env;

// const DB_URL = `mongodb://${DB_HOST}:${DB_PORT}`;
const DB_URL = `mongodb+srv://${DB_HOST}:${DB_PWD}@${DB_CLUSTER}.mongodb.net/?retryWrites=true&w=majority`;

const connectMongoDB = async () => {
  try {
    await mongoose.connect(DB_URL, {
      dbName: DB_NAME,
      auth: {
        username: DB_USER,
        password: DB_PWD
      },
      // authSource: DB_NAME
    });
    logger.info("MongoDB connected:", {
      url: DB_URL,
      dbName: DB_NAME
    });
  } catch (error) {
    logger.error("MongoDB initial connection error: ", error);
  }
  mongoose.connection.on("error", (err) => {
    logger.error("MongoDB error: ", err);
  });
}

export {
  connectMongoDB
}