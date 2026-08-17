import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../types/errors";
import { config } from "@/config/env";
import { AuthUtils } from "../utils/auth.util";
import { User } from "@/database/models/User";
import DatabaseConfig from "@/config/database";
import { JwtPayload } from "@/shared/types/interfaces";
import { de } from "zod/v4/locales";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const accessToken = req.cookies?.accessToken;

    if (!refreshToken && !accessToken) {
      throw new UnauthorizedError("Authentication required");
    }

    if (accessToken) {
      const decoded = jwt.verify(
        accessToken,
        config.JWT_ACCESS_SECRET,
      ) as JwtPayload;

      req.user = decoded;
      return next();
    }

    // Fallback sang refresh token
    const decoded = jwt.verify(
      refreshToken,
      config.JWT_REFRESH_SECRET,
    ) as JwtPayload;

    const newAccessToken = AuthUtils.generateAccessToken({
      userId: decoded.userId,
      username: decoded.username,
      storeId: decoded.storeId,
    });

    AuthUtils.setTokenCookies(res, {
      accessToken: newAccessToken,
      refreshToken,
    });

    req.user = decoded;
    next();
  } catch (error) {
    next(new UnauthorizedError("Invalid or expired token"));
  }
};

export const authorization = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedError("User not authenticate");
    }

    const userRepo = DatabaseConfig.getRepository(User);

    const user = await userRepo.findOne({
      where: { id: userId },
      relations: {
        role: true,
        store: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    (req as any).user = {
      ...req.user,
      storeId: user.store?.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    };

    req.permission = user.role?.permissions || {};
    if (req.method == "POST") {
      req.body.creatorId = userId;
      if (req.body.lines && req.body.lines.length > 0) {
        req.body.lines = req.body.lines.map((line: any) => ({
          ...line,
          creatorId: userId,
        }));
      }
    }
    if (req.method === "PUT") req.body.updaterId = userId;
    if (req.method === "GET" && user.storeId) req.query.storeId = user.storeId;
  } catch (error) {
    logger.error("Authorization error:", error);
    next(new UnauthorizedError("Authorization failed"));
  }
};
