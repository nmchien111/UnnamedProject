import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

export const config = {
  PORT: process.env.PORT,

  NODE_ENV: process.env.NODE_ENV || "development",

  FE_DOMAIN: process.env.FE_DOMAIN || "http://localhost:3000",

  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: parseInt(process.env.DB_PORT || "3306", 10),
  DB_USERNAME: process.env.DB_USERNAME || "root",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_DATABASE: process.env.DB_DATABASE || "backend_db",
};

export default config;
