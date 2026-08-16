import { Request, Response } from "express";
import {
  DeepPartial,
  FindManyOptions,
  FindOptionsWhere,
  EntityManager,
} from "typeorm";
import { IError } from "./errors";

export type IEntityManager = EntityManager;

export type ICreateDto<T> = DeepPartial<T>;

export interface IRepository<T> {
  // Basic CRUD with soft delete awareness
  findById(
    id: string,
    manager?: EntityManager,
    includeDeleted?: boolean,
  ): Promise<T | null>;
  findAll(manager: EntityManager, includeDeleted: boolean): Promise<T | null>;
  create(entity: DeepPartial<T>, manager: EntityManager): Promise<T>;
  update(
    id: string,
    entity: Partial<T>,
    manager: EntityManager,
  ): Promise<T | null>;
  findOne(
    options: FindOptionsWhere<T>,
    manager?: EntityManager,
    includeDeleted?: boolean,
  ): Promise<T | null>;
  exists(
    options: FindOptionsWhere<T>,
    manager?: EntityManager,
    includeDeleted?: boolean,
  ): Promise<boolean>;

  // Delete operations
  delete(id: string, manager?: EntityManager): Promise<boolean>; // Hard delete
  softDelete(id: string, manager?: EntityManager): Promise<boolean>; // Soft delete
  restore(id: string, manager?: EntityManager): Promise<boolean>; // Restore soft deleted

  // Soft delete specific methods
  findDeleted(manager?: EntityManager): Promise<T[]>;
  findByIdWithDeleted(id: string, manager?: EntityManager): Promise<T | null>;
  isDeleted(id: string, manager?: EntityManager): Promise<boolean>;

  // Batch operations
  createMany(entities: DeepPartial<T>[], manager?: EntityManager): Promise<T[]>;
  updateMany(
    ids: string[],
    entity: Partial<T>,
    manager?: EntityManager,
  ): Promise<T[]>;
  deleteMany(ids: string[], manager?: EntityManager): Promise<number>;
  softDeleteMany(ids: string[], manager?: EntityManager): Promise<number>;
  restoreMany(ids: string[], manager?: EntityManager): Promise<number>;

  findWithPagination(
    options: FindManyOptions<T>,
    manager?: EntityManager,
    includeDeleted?: boolean,
  ): Promise<{ data: T[]; total: number }>;

  // Utility methods
  count(
    where?: FindOptionsWhere<T>,
    manager?: EntityManager,
    includeDeleted?: boolean,
  ): Promise<number>;

  withTransaction<R>(
    operation: (manager: EntityManager) => Promise<R>,
  ): Promise<R>;
}

export type CompareOperator = ">=" | ">" | "<=" | "<" | "=";
export const rangeSuffixes = ["Gte", "Gt", "Eq", "Lte", "Lt"];
export type RangeSuffix = (typeof rangeSuffixes)[number];
export const OPERATOR_MAP: Record<RangeSuffix, CompareOperator> = {
  Gte: ">=",
  Gt: ">",
  Lte: "<=",
  Lt: "<",
  Eq: "=",
};

export interface Pagination {
  totalRecords: number;
  currentPage: number;
  size: number;
  totalPages: number;
}

export interface SendResponseParams {
  res: Response;
  data?: any;
  message?: string;
  statusCode?: number;
}

export interface SendErrorParams {
  res: Response;
  message?: string;
  statusCode?: number;
  errors?: IError[];
}

export interface ApiResponse<T = any> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
  errors?: any;
  code?: string;
  summary?: any; // Optional error code for more specific error handling
}

export interface IFindOptions<T> extends FindManyOptions<T> {
  page?: number;
  size?: number;
  keyword?: string; // Keyword for text search
  searchFields?: (keyof T)[]; // Fields to search in
  timeField?: keyof T; // Field to apply the date range filter on
  summaryFields?: (keyof T)[]; // Fields to summarize
  type?: string; // Example field for filtering by type
  status?: string; // Example field for filtering by status
  startAt?: Date; // Example field for filtering by date range
  endAt?: Date; // Example field for filtering by date range
  sortBy?: string; // Field to sort by
  sortOrder?: "ASC" | "DESC"; // Sort direction
  isFinished?: boolean; // Example field for filtering by completion status
  filterOptions?: (keyof T)[]; // Additional filter options
  projectId?: string; // Example field for filtering by project ID
  employeeId?: string; // Example field for filtering by employee ID
  fundId?: string; // Example field for filtering by fund ID
  advanceId?: string; // Example field for filtering by advance ID

  storeId?: string;
  storeIds?: string[];
  categoryId?: string[];
  productIds?: string[]; // Example field for filtering by product IDs
  warehouseIds?: string[]; // Example field for filtering by warehouse IDs
  employeeIds?: string[]; // Example field for filtering by employee IDs
  fundCategoryIds?: string[]; // Example field for filtering by fundCategory IDs
  partnerIds?: string[]; // Example field for filtering by partner IDs
  toFundIds?: string[]; // Example field for filtering by fund IDs
}
