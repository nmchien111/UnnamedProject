import { Request, Response } from "express";
import {
  DeepPartial,
  FindManyOptions,
  FindOptionsWhere,
  EntityManager,
} from "typeorm";
import { IError } from "./error";

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
