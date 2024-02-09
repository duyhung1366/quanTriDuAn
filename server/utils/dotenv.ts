import fs from "fs";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

const NODE_ENV = process.env.NODE_ENV || "development";

const dotenvFiles = [
  `.env.${NODE_ENV}`,
  `.env`
].filter(Boolean);

const config = () => {
  dotenvFiles.forEach((path) => {
    if (fs.existsSync(path)) {
      dotenvExpand.expand(dotenv.config({ path }));
    }
  })
}

export default {
  config
}
