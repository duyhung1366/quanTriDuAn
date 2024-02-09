import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import { verifierJWT } from "./middlewares/auth";
import { handleAPIError, handleNotFoundError } from "./middlewares/errorHandlers";
import { router } from "./routes";
import { authRouter } from "./routes/user/auth";
import { SocketIo } from "./socketio";
import { connectMongoDB } from "./utils/database";
import dotenv from "./utils/dotenv";
import logger from "./utils/logger";
import DiscordService from "./services/affiliate/discord";
import './services/work/cron';

dotenv.config();

const PORT = +(process.env.PORT || 3001);
const ENV = process.env.NODE_ENV || "development";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser())
app.use(cors({
  origin: ENV === "development" ? true : (process.env.ALLOWED_ORIGIN || "").split(","),
  credentials: true,
  allowedHeaders: 'X-PINGOTHER, Content-Type, Authorization, X-Forwarded-For, x-requested-with',
  methods: 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS',
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

const baseUrl = process.env.BASE_URL || "";

app.use(`${baseUrl}/api/auth`, authRouter);

app.use(`${baseUrl}/api`, verifierJWT);
app.use(`${baseUrl}/api`, router);

app.use(handleAPIError);
app.use(handleNotFoundError);

(async () => {
  try {
    await DiscordService.login();
  } catch (error) {
    console.log("error", error);
  }
})();

const httpServer = createServer(app);

export const io = new SocketIo(httpServer);
io.connection();


connectMongoDB().then(() => {
  httpServer.listen(PORT, () => {
    logger.info("Server is running on port", PORT);
  });
})

