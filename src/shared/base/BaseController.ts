import { injectable } from "inversify";
import { Request, Response, NextFunction } from "express";
import { ObjectLiteral } from "typeorm";
import { BaseService } from "./BaseService";
import {
  IFindOptions,
  SendErrorParams,
  SendResponseParams,
} from "@/shared/types/interfaces";
import { NotFoundError } from "../types/errors";
import { ErrorsMessages } from "../constants/errors";

export abstract class BaseController<T extends ObjectLiteral> {
  protected abstract service: BaseService<T>;

  protected sendResponse({
    res,
    data,
    message = "Success",
    statusCode = 200,
  }: SendResponseParams): void {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timeStamp: new Date().toISOString(),
    });
  }

  protected sendError({
    res,
    message = "Error",
    statusCode = 500,
    errors = [],
  }: SendErrorParams): void {
    res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }

  getAllWithPagination = async (
    req: Request,
    res: Response,
    next: (err?: any) => void,
  ): Promise<Response<any, Record<string, any>> | undefined> => {
    try {
      const options = req.query as unknown as IFindOptions<T>; // Cast to any simplicity

      const data = await this.service.findAllWithPagination(
        options,
        undefined,
        req,
      );
      return res.status(data.statusCode).json(data);
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.findAll();

      return res.status(200).json({
        success: true,
        data,
        statusCode: 200,
        message: "Fetched Succesfully",
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const data = await this.service.findById(id as string, req);

      if (!data) {
        return res.status(404).json({
          message: "Item not found",
          statusCode: 404,
          data: null,
          success: false,
          errors: {
            field: id,
            code: ErrorsMessages.not_found,
          },
        });
      }

      return res.json({
        success: true,
        data,
        statusCode: 200,
        message: "Fetched Successfully",
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  /**
   * POST /
   * Create new item
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.create(req.body, undefined, req);
      return res.status(201).json({
        success: true,
        data,
        statusCode: 201,
        message: "Created Successfully",
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  /**
   * PUT /:id
   * Update item
   */
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const data = await this.service.update(id, req.body, undefined, req);

      if (!data) {
        return res.status(404).json({
          success: false,
          message: "Item not found",
          data: null,
          statusCode: 404,
          errors: {
            field: "id",
            code: ErrorsMessages.not_found,
          },
        });
      }

      return res.json({
        success: true,
        data,
        message: "Updated successfully",
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE
   * Delete item
   */

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const result = await this.service.delete(id, undefined, req);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "Item not found",
          data: null,
          statusCode: 404,
          errors: {
            field: "id",
            code: ErrorsMessages.not_found,
          },
        });
      }

      return res.json({
        success: true,
        message: "Deleted successfully",
        statusCode: 200,
        data: id,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  };

  checkExits = (idKey: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const id = req.params?.[idKey];

        if (!id) {
          throw new NotFoundError("id.not_found", {
            field: idKey,
            code: ErrorsMessages.not_found,
          });
        }

        const exists = await this.service.exists(id as any);
        if (!exists) {
          throw new NotFoundError("id.not_found", {
            field: idKey,
            code: ErrorsMessages.not_found,
          });
        }

        return next();
      } catch (error) {
        return next(error);
      }
    };
  };
}
