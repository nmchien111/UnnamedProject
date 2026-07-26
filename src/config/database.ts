import { DataSource } from "typeorm";
import { config } from "./env";
import path from "path";

const isDevelopment = config.NODE_ENV !== "production";
const isProduction = config.NODE_ENV === "production";

export const DatabaseConfig = new DataSource({
  type: "postgres",
  host: config.DB_HOST,
  port: config.DB_PORT,
  username: config.DB_USERNAME,
  password: config.DB_PASSWORD,
  database: config.DB_DATABASE,
  synchronize: isDevelopment,
  logging: isDevelopment,
  entities: [path.join(__dirname, "../entities/**/*.{ts,js}")],
  migrations: [path.join(__dirname, "../migrations/**/*.{ts,js}")],
  subscribers: [path.join(__dirname, "../subscribers/**/*.{ts,js}")],
});

export default DatabaseConfig;
