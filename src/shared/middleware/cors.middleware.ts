import config from "@/config/env";
import cors from "cors";

const corsMiddleware = cors({
  origin: function (origin: any, callback: any) {
    const allowedOrigins = [config.FE_DOMAIN, "http://localhost:3001"];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-device-id",
    "x-timezone",
    "x-ip-address",
    "x-refresh-token",
    "x-store-id",
    "x-store-code",
  ],
});

export default corsMiddleware;
