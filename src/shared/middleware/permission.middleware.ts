import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../types/errors";
import {
  Module,
  MODULES,
  Permission,
  PERMISSIONS,
  PermissionStructure,
} from "@/database/models/Role";

export function createEmptyPermissions(): PermissionStructure {
  const permissions: PermissionStructure = {};
  for (const m of MODULES) {
    permissions[m] = [];
  }
  return permissions;
}

export function createFullPermissions(): PermissionStructure {
  const permissions: PermissionStructure = {};
  for (const m of MODULES) {
    permissions[m] = [...PERMISSIONS];
  }
  return permissions;
}

export const permissionMiddleware = (
  module: Module,
  permission: Permission,
) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userJwt = req.user;
      if (!userJwt || !userJwt.userId) {
        throw new UnauthorizedError("User not authenticated");
      }
      if (userJwt.username === "admin") {
        return next(); // Dùng return để tránh tiếp tục thực thi
      }
      const permissions = (req as any).permissions || {};
      const modulePermissions = (permissions[module] || []) as Permission[];

      if (!modulePermissions.includes(permission)) {
        throw new UnauthorizedError("Insufficient permissions");
      }

      next(); // Chỉ gọi next() một lần duy nhất ở cuối
    } catch (error) {
      console.error(
        `Error in permission middleware for module ${module}:`,
        error,
      );
      if (!res.headersSent) {
        next(error);
      }
    }
  };
};
