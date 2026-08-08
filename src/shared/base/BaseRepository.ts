import {
  Repository,
  EntityTarget,
  FindOptionsWhere,
  DeepPartial,
  EntityManager,
  FindManyOptions,
  IsNull,
  DataSource,
  FindOneOptions,
  FindOptionsRelations,
  SelectQueryBuilder,
  Brackets,
  ObjectLiteral,
  In,
} from "typeorm";
import { DatabaseConfig } from "@/config/database";
import { IRepository } from "../types/interfaces";
import { NotFoundError } from "@/shared/types/errors";
import { injectable } from "inversify";
import { generateCode, getEntityByType } from "../utils/code.utils";
import { Utils } from "../utils/utils";
import { FileStatusEnum } from "../constants/enum";
import logger from "../utils/logger";
import fs from "fs/promises";
import { OPERATOR_MAP, rangeSuffixes } from "../types/interfaces";

export interface IFindPaginationOptions<T> extends FindManyOptions<T> {
  keyword?: string; // Keyword for text search
  searchFields?: (keyof T | string)[]; // Fields to search in
  type?: string; // Example field for filtering by type
  status?: string; // Example field for filtering by status
  startAt?: Date; // Example field for filtering by date range
  endAt?: Date; // Example field for filtering by date range
  dateFilter?: string; // Specific date field to apply the date range filter
  sortBy?: string; // Field to sort by
  sortOrder?: "ASC" | "DESC"; // Sort direction
  isFinished?: boolean; // Example field for filtering by completion status
  storeId?: string; // Example field for filtering by store ID
  filterOptions?: (keyof T)[]; // Additional filter options
  filterDate?: string;
  summaryFields?: (keyof T)[]; // Các trường có kiểu số cần tính tổng (ví dụ: ['plannedHours', 'actualHours'])
  moreQuery?: any; // Additional complex queries
}

@injectable()
export abstract class BaseRepository<T extends ObjectLiteral> {
  protected abstract entityClass: EntityTarget<T>;
  protected dataSource: DataSource;
  protected enableFileAttachment: boolean = true; // Có thể override trong repo con

  /**
   * Cho phép nhiều file cùng category cho 1 entity
   * - false (default): Mỗi entity chỉ được 1 file/category tại 1 thời điểm (giữ file mới nhất)
   * - true: Không giới hạn số file
   */
  protected mutileFile: boolean = true;

  /**
   * Danh sách các trường nested (object[] hoặc object) trên entity mà
   * repo con có thể khai báo để BaseRepository gắn files cho các phần tử con.
   *
   * Hỗ trợ path notation để chỉ định chính xác entity cần load files:
   * - ['variants'] → gắn file cho từng variant
   * - ['lines.productVariant'] → gắn file cho productVariant trong mỗi orderLine
   * - ['lines', 'lines.productVariant'] → gắn file cho cả orderLine và productVariant
   *
   * Nếu không khai báo, repository sẽ fallback quét mọi trường để phát hiện mảng object có `id`.
   *
   * ⚠️ LƯU Ý: Nested entities LUÔN chỉ giữ 1 file/category (bất kể multipleFile của parent)
   */
  protected nestedFileFields?: string[];

  /**
   * Select fields cho detail query (findById, findOne)
   * Mặc định sẽ lấy đầy đủ thông tin
   */
  protected selectedFields?: any;
  /**
   * Select fields cho list query (find, findAll, findWithPagination)
   * Nếu không được set, sẽ fallback về selectedFields
   * Dùng để giảm dữ liệu trả về khi query danh sách
   */
  protected selectedFieldsForList?: any;

  /**
   * Relations cho detail query (findById, findOne)
   * Mặc định sẽ join đầy đủ thông tin
   */
  protected relations: FindOptionsRelations<T>;
  /**
   * Relations cho list query (find, findAll, findWithPagination)
   * Nếu không được set, sẽ fallback về relations
   * Dùng để giảm dữ liệu trả về khi query danh sách
   */
  protected relationsForList?: FindOptionsRelations<T>;

  protected async extendQueryBuilder(
    qb: SelectQueryBuilder<T>,
    options: IFindPaginationOptions<T>,
  ): Promise<void> {
    // mặc định không làm gì — repo con override khi cần join/group/select thêm
  }

  /**
   * Recursively join relations from FindOptionsRelations config
   * Ví dụ: { variants: { options: true, unit: true } }
   */
  private joinRelations(
    qb: SelectQueryBuilder<T>,
    relations: FindOptionsRelations<T> | boolean,
    parentAlias: string = "entity",
  ): void {
    if (!relations || typeof relations === "boolean") return;

    Object.keys(relations).forEach((relationKey) => {
      const relationValue = (relations as any)[relationKey];
      const relationAlias = `${parentAlias}_${relationKey}`;

      qb.leftJoinAndSelect(`${parentAlias}.${relationKey}`, relationAlias);

      // Đệ quy nếu có nested relations
      if (relationValue && typeof relationValue === "object") {
        this.joinRelations(qb, relationValue, relationAlias);
      }
    });
  }

  // sửa trong BaseRepository
  protected mapRawEntities(rawAndEntities: {
    entities: T[];
    raw: any[];
  }): any[] {
    return rawAndEntities.entities.map((entity, index) => {
      const raw = rawAndEntities.raw[index];
      const extras: any = {};

      // auto map các alias có prefix entity_
      Object.keys(raw).forEach((key) => {
        if (key.startsWith("entity_total")) {
          const field = key.replace("entity_", "");
          extras[field] = raw[key];
        }
      });

      return { ...entity, ...extras };
    });
  }

  constructor() {
    // Initialize repository in postConstruct or through method call
    this.dataSource = DatabaseConfig;
  }

  public getRepository(manager?: EntityManager): Repository<T> {
    if (manager) {
      return manager.getRepository(this.entityClass);
    }
    return this.dataSource.getRepository(this.entityClass);
  }

  /**
   * Find many
   */
  async find(options?: FindManyOptions, manager?: EntityManager) {
    const repo = this.getRepository(manager);

    const finalOptions: FindManyOptions<T> = {
      ...options,
      select:
        options?.select || this.selectedFieldsForList || this.selectedFields,
      relations: options?.relations || this.relationsForList || this.relations,
    };

    const entities = await repo.find(finalOptions);

    // if (this.enableFileAttachment) {
    //   return await this.attachFilesToEntities(entities);
    // }

    return entities;
  }

  /**
   * Find one
   */

  async findOne(options?: FindManyOptions, manager?: EntityManager) {
    const repo = this.getRepository(manager);

    const finalOptions: FindManyOptions<T> = {
      ...options,
      select: options?.select || this.selectedFields,
      relations: options?.relations || this.relations,
    };

    const entity = await repo.findOne(finalOptions);

    return entity;
  }

  async findById(
    id: string,
    includedDeleted: boolean = false,
    manager?: EntityManager,
  ) {
    const repo = this.getRepository(manager);

    if (
      this.extendQueryBuilder === BaseRepository.prototype.extendQueryBuilder
    ) {
      // Nếu không override extendQueryBuilder, dùng findOneBy để tối ưu query
      const options: FindOneOptions<T> = {
        where: { id } as any,
        select: this.selectedFields,
        relations: this.relations,
      };

      if (!includedDeleted) {
        options.where = { ...options.where, deletedAt: IsNull() } as any;
        options.withDeleted = false;
      }

      const entity = await repo.findOne(options);
      return entity;
    }

    // Nếu override extendQueryBuilder, dùng query builder để join thêm relations
    const qb = repo.createQueryBuilder("entity");
    qb.where("entity.id = :id", { id });

    // Xử lý xóa mềm (soft delete)
    if (!includedDeleted) {
      qb.andWhere("entity.deletedAt IS NULL");
    } else {
      qb.withDeleted();
    }

    // Join relations
    if (this.relations) {
      this.joinRelations(qb, this.relations, "entity");
    }

    // Extend query builder for additional joins or conditions
    await this.extendQueryBuilder(qb, {} as any);

    // Nếu có extra select/group thì mapRawEntities để gắn thêm vào entity ngược lại thì getOne
    const hasGroupBy = (qb as any).expressionMap?.groupBys?.length > 0;
    const hasExtraSelect = (qb as any).expressionMap?.selects?.some(
      (select: any) => select.aliasName?.startsWith("entity_"),
    );

    let entity: T | null = null;
    if (hasGroupBy || hasExtraSelect) {
      const rawAndEntities = await qb.getRawAndEntities();
      const data = this.mapRawEntities(rawAndEntities);
      entity = data[0] || null;
    } else {
      entity = await qb.getOne();
    }

    // Auto-attach files from MasterFile
    // if (entity && this.enableFileAttachment) {
    //   return await this.attachFilesToEntity(entity);
    // }

    return entity;
  }

  async findAll(
    manager?: EntityManager,
    includeDeleted: boolean = false,
  ): Promise<T[]> {
    const repo = this.getRepository(manager);

    const options: FindManyOptions<T> = {
      select: this.selectedFieldsForList || this.selectedFields,
      relations: this.relationsForList || this.relations,
    };

    if (!includeDeleted) {
      options.where = { deletedAt: IsNull() } as any;
    } else {
      options.withDeleted = true;
    }

    const entities = await repo.find(options);

    // if (this.enableFileAttachment) {
    //   return await this.attachFilesToEntities(entities);
    // }
    return entities;
  }

  async findWithPagination(
    options: IFindPaginationOptions<T>,
    manager?: EntityManager,
    includeDeleted: boolean = false,
  ): Promise<{ data: T[]; total: number; summary?: any }> {
    const page = options.skip || 1;
    const size = options.take || 20;

    const repo = this.getRepository(manager);
    const qb = repo.createQueryBuilder("entity");

    // Join relations: ưu tiên relationsForList cho list query
    const defaultRelations = this.relationsForList || this.relations;
    const allRelations = { ...defaultRelations, ...options.relations };
    if (allRelations && Object.keys(allRelations).length > 0) {
      this.joinRelations(qb, allRelations, "entity");
    }

    if (options.keyword) {
      let textSearchableFields: string[] = [];

      const resolveFieldAlias = (field: string): string | null => {
        if (!field.includes(".")) return `entity.${field}`;

        const [relation, column] = field.split(".");

        const joinAttr = (qb as any).expressionMap.joinAttributes.find(
          (j: any) => j.relation?.propertyName === relation,
        );

        if (!joinAttr) return null; // relation chưa join → bỏ qua

        return `${joinAttr.alias.name}.${column}`;
      };

      // ===== 1. Xác định danh sách field cần search =====
      if (options.searchFields && options.searchFields.length > 0) {
        textSearchableFields = options.searchFields
          .map((field) => resolveFieldAlias(field as string))
          .filter((alias): alias is string => alias !== null);
      } else {
        // auto detect using typeorm native
        const autoDetectedFields = repo.metadata.columns
          .filter((col) => {
            const type = col.type;
            return (
              type === String ||
              ["varchar", "text", "nvarchar", "longtext"].includes(
                type as string,
              )
            );
          })
          .map((col) => `entity.${col.propertyName}`);

        textSearchableFields.push(...autoDetectedFields);

        const allRelations = { ...this.relations, ...options.relations };
        if (allRelations) {
          Object.keys(allRelations).forEach((relationKey) => {
            ["name", "code"].forEach((col) => {
              const resolved = resolveFieldAlias(`${relationKey}.${col}`);
              if (resolved) textSearchableFields.push(resolved);
            });
          });
        }
      }

      // ===== 2. Apply AndWhere cho text search =====
      if (textSearchableFields.length > 0) {
        qb.andWhere(
          new Brackets((qb1) => {
            textSearchableFields.forEach((field, idx) => {
              const isLikelyUuidField = field.toLowerCase().includes("id");

              const fieldExpression = isLikelyUuidField
                ? `CAST(${field} AS TEXT)`
                : field;

              const condition = `
                      unaccent(LOWER(${fieldExpression}))
                      ILIKE unaccent(LOWER(:keyword))
                    `;

              if (idx === 0) {
                qb1.where(condition, { keyword: `%${options.keyword}%` });
              } else {
                qb1.orWhere(condition);
              }
            });
          }),
        );
      }
    }

    await this.extendQueryBuilder(qb, options);

    // ==== Filter ====
    // Filter theo storeId nếu entity có field storeId
    if (options.storeId) {
      const entityMetadata = repo.metadata;
      const hasTenantIdColumn = entityMetadata.columns.some(
        (col) => col.propertyName === "storeId",
      );
      if (hasTenantIdColumn) {
        qb.andWhere("entity.storeId = :storeId", {
          storeId: options.storeId,
        });
      }
    }

    // ===== Range Filters (Gte, Gt, Eq, Lte, Lt) =====
    // Xử lý các trường range filter từ moreQuery hoặc options
    const rangeFilterSource = options.moreQuery || options;

    if (rangeFilterSource && typeof rangeFilterSource === "object") {
      const entityMetadata = repo.metadata;
      const entityColumns = entityMetadata.columns.map(
        (col) => col.propertyName,
      );

      Object.keys(rangeFilterSource).forEach((key) => {
        const matchedSuffix = rangeSuffixes.find((suffix) =>
          key.endsWith(suffix),
        );
        if (matchedSuffix) {
          // Cắt suffix để lấy tên field
          const fieldName = key.slice(0, -matchedSuffix.length);

          // Kiểm tra field có tồn tại trong entity không
          if (entityColumns.includes(fieldName)) {
            const value = rangeFilterSource[key];

            if (value != null && value !== "") {
              const operator = OPERATOR_MAP[matchedSuffix];
              const paramName = `${fieldName}_${matchedSuffix}`;

              qb.andWhere(`entity.${fieldName} ${operator} :${paramName}`, {
                [paramName]: value,
              });
            }
          }
        }
      });
    }

    if (includeDeleted) {
      qb.andWhere("entity.deletedAt IS NOT NULL");
    } else {
      qb.andWhere("entity.deletedAt IS NULL");
    }

    if (options.status !== "undefined") {
      qb.andWhere("entity.status = :status", { status: options.status });
    }

    if (options.type !== "undefined") {
      const hasTypeColumn = repo.metadata.columns.some(
        (col) => col.propertyName === "type",
      );

      if (hasTypeColumn) {
        qb.andWhere("entity.type = :type", { type: options.type });
      }
    }

    if (options.isFinished !== undefined) {
      qb.andWhere("entity.isFinished = :isFinished", {
        isFinished: options.isFinished,
      });
    }

    // BETWEEN createdAt
    if (options.startAt && options.endAt) {
      const dateField = options.dateFilter || "createdAt";
      qb.andWhere(`entity.${dateField} BETWEEN :start AND :end`, {
        start: new Date(options.startAt),
        end: new Date(options.endAt),
      });
    }

    // ===== Sorting =====
    if (options.sortBy && options.sortOrder) {
      let softField: string | null = null;

      // Nếu sortBy có dấu chấm (relation field), kiểm tra xem relation đã được join chưa
      if (options.sortBy.includes(".")) {
        const [relationName] = options.sortBy.split(".");
        const isJoined = (qb as any).expressionMap.joinAttributes.some(
          (join: any) => join.relation?.propertyName === relationName,
        );

        if (isJoined) {
          softField = options.sortBy;
        }
      } else {
        // Chỉ cho phép sort theo các field có trong entity
        const entityColumns = repo.metadata.columns.map(
          (col) => col.propertyName,
        );
        if (entityColumns.includes(options.sortBy)) {
          softField = `entity.${options.sortBy}`;
        }
        // Nếu không phải column thì bỏ qua, để repo con tự custom
      }

      // Nếu softField được xác định, apply orderBy
      if (softField) {
        qb.orderBy(softField, options.sortOrder);
      }
      // Nếu không xác định được softField, repo con có thể override extendQueryBuilder để custom sort
    } else {
      // Default sort by createdAt DESC
      qb.orderBy("entity.createdAt", "DESC");
    }

    let summary: any = {};
    if (options.summaryFields && options.summaryFields.length > 0) {
      const summaryQb = qb.clone();

      // Xóa skip và take khỏi summary query
      summaryQb.skip(0).take(undefined as any);

      // Xóa order by để tối ưu performance
      (summaryQb as any).expressionMap.orderBys = [];

      //Lưu lại các computed selects (có prefix entity_) trước khi xóa
      const computedSelects =
        (summaryQb as any).expressionMap.selects.filter((select: any) =>
          select.aliasName?.startsWith("entity_"),
        ) || [];

      // Xóa joins không cần thiết (giữ lại selects cho computed fields)
      (summaryQb as any).expressionMap.joinAttributes = [];

      // Build sum selects
      const sumSelects: string[] = [];

      options.summaryFields.forEach((field) => {
        const fieldStr = String(field);

        // Kiểm tra xem field có phải là computed field không
        // Thử tìm cả camelCase và lowercase
        let computedSelect = computedSelects.find(
          (s: any) => s.aliasName === `entity_${fieldStr}`,
        );

        // Nếu không tìm thấy, thử lowercase
        if (!computedSelect) {
          computedSelect = computedSelects.find(
            (s: any) => s.aliasName === `entity_${fieldStr.toLowerCase()}`,
          );
        }

        if (computedSelect) {
          // Nếu là computed field, wrap subquery trong SUM
          // Lấy expression gốc từ computed select
          const subqueryExpression = computedSelect.selection;
          sumSelects.push(
            `COALESCE(SUM((${subqueryExpression})), 0) as ${fieldStr}_sum`,
          );
        } else {
          // Nếu là column thông thường
          sumSelects.push(
            `COALESCE(SUM(entity.${fieldStr}), 0) as ${fieldStr}_sum`,
          );
        }
      });

      // Clear selects và set lại với sum
      (summaryQb as any).expressionMap.selects = [];
      summaryQb.select(sumSelects);

      const summaryResult = await summaryQb.getRawOne();

      // Map kết quả summary - xử lý lowercase keys
      options.summaryFields.forEach((field) => {
        const fieldStr = String(field);
        // PostgreSQL trả về lowercase key
        const summaryKey = `${fieldStr.toLowerCase()}_sum`;
        const value = summaryResult[summaryKey];

        // Nếu field đã có prefix "total" thì giữ nguyên, không thêm "total" nữa
        const summaryFieldName = fieldStr.toLowerCase().startsWith("total")
          ? fieldStr
          : `total${fieldStr.charAt(0).toUpperCase() + fieldStr.slice(1)}`;

        summary[summaryFieldName] = parseFloat(value) || 0;
      });
    }

    qb.skip((page - 1) * size).take(size);

    // ===== Execute =====
    const hasGroupBy = (qb as any).expressionMap?.groupBys?.length > 0;
    const hasExtraSelect = (qb as any).expressionMap?.selects?.some((s: any) =>
      s.aliasName?.startsWith("entity_"),
    );

    if (hasGroupBy || hasExtraSelect) {
      const [rawAndEntities, total] = await Promise.all([
        qb.getRawAndEntities(),
        qb.getCount(),
      ]);
      let data = this.mapRawEntities(rawAndEntities);
      if (this.enableFileAttachment && Array.isArray(data)) {
        data = await this.attachFilesToEntities(data);
      }
      return {
        data,
        total,
        summary: Object.keys(summary).length > 0 ? summary : undefined,
      };
    } else {
      const [data, total] = await qb.getManyAndCount();
      let finalData = data;
      if (this.enableFileAttachment && Array.isArray(data)) {
        finalData = await this.attachFilesToEntities(data);
      }

      return {
        data: finalData,
        total,
        summary: Object.keys(summary).length > 0 ? summary : undefined,
      };
    }
  }

  async findByOptions(
    options: FindManyOptions<T>,
    manager?: EntityManager,
  ): Promise<T[]> {
    const data = await this.getRepository(manager).find(options);
    if (this.enableFileAttachment && Array.isArray(data)) {
      return await this.attachFilesToEntities(data);
    }
    return data;
  }

  async findByOption(
    options: FindOneOptions<T>,
    manager?: EntityManager,
    includeDeleted: boolean = false,
  ): Promise<T | null> {
    if (!includeDeleted) {
      options.where = { ...options.where, deletedAt: IsNull() } as any;
    }
    const data = await this.getRepository(manager).findOne(options);
    if (this.enableFileAttachment && data) {
      return await this.attachFilesToEntity(data);
    }
    return data;
  }

  async findAndCount(
    options: FindManyOptions<T>,
    manager?: EntityManager,
    includeDeleted: boolean = false,
  ): Promise<[T[], number]> {
    if (!includeDeleted) {
      options.where = { ...options.where, deletedAt: IsNull() } as any;
    } else {
      options.withDeleted = true;
    }
    return await this.getRepository(manager).findAndCount(options);
  }

  async create(data: DeepPartial<T>, manager?: EntityManager): Promise<T> {
    const repo = this.getRepository(manager);
    const entity = repo.create(data);
    const saved = await repo.save(entity);
    return saved;
  }

  /**
   * Attach files to a single entity
   * Tự động gọi khi query chi tiết entity
   */

  private async attachFilesToEntity(entity: T & { id?: string }): Promise<T> {
    if (!entity || !entity.id) {
      return entity;
    }

    try {
      // Get File repository from store schema
      const fileRepo = this.dataSource.getRepository("File");

      // Collect all entity IDs (root + nested)
      const collectedIds: string[] = [entity.id];

      //Helper function to get value from path (e.g., 'lines.productVariant')
      const getValueByPath = (obj: any, path: string): any[] => {
        const parts = path.split(".");
        let current: any = obj;

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (!current) {
            return [];
          }

          // If current is an array, map over each item to get the property
          if (Array.isArray(current)) {
            const mapped = current
              .map((item) => item?.[parts[i]])
              .filter((val) => val !== null && val !== undefined);
            current = mapped;
          } else {
            // Normal object property access
            current = current[part];

            if (!current) {
              return [];
            }
          }
        }

        // Flatten if result is nested array
        if (Array.isArray(current)) {
          return current.flat();
        }
        if (current && typeof current === "object") {
          return [current];
        }
        return [];
      };

      // Collect nested entity IDs based on nestedFileFields
      if (this.nestedFileFields && this.nestedFileFields.length > 0) {
        for (const fieldPath of this.nestedFileFields) {
          const values = getValueByPath(entity, fieldPath);

          for (const item of values) {
            if (item && typeof item === "object" && item.id) {
              collectedIds.push(item.id);
            }
          }
        }
      }

      // Get files for all collected IDs
      const files = await fileRepo.find({
        where: {
          entityId: In(collectedIds),
          status: FileStatusEnum.ACTIVE,
          deletedAt: null,
        } as any,
        order: { createdAt: "ASC" } as any,
      });

      // Group files by entityId and category
      const filesByEntity: Record<string, Record<string, any[]>> = {};

      for (const file of files) {
        const entityId = (file as any).entityId;
        if (!entityId) continue;

        if (!filesByEntity[entityId]) {
          filesByEntity[entityId] = {};
        }

        const category = (file as any).category || "uncategorized";
        if (!filesByEntity[entityId][category]) {
          filesByEntity[entityId][category] = [];
        }

        filesByEntity[entityId][category].push(file);
      }

      // Attach files to root entity
      const entAny: any = { ...entity };
      if (entity.id && filesByEntity[entity.id]) {
        Object.assign(entAny, filesByEntity[entity.id]);
      }

      // Attach files to nested entities based on paths
      if (this.nestedFileFields && this.nestedFileFields.length > 0) {
        for (const fieldPath of this.nestedFileFields) {
          const parts = fieldPath.split(".");
          let current: any = entAny;

          // Navigate to parent of target field
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) break;
            current = current[parts[i]];
          }

          const lastPart = parts[parts.length - 1];

          // Attach files to array items
          if (Array.isArray(current)) {
            for (let i = 0; i < current.length; i++) {
              const item = current[i];
              if (!item) continue;

              const target = parts.length === 1 ? item : item[lastPart];

              if (Array.isArray(target)) {
                // Target is array
                item[lastPart] = target.map((subItem: any) => {
                  if (!subItem || !subItem.id) return subItem;
                  const childFiles = filesByEntity[subItem.id] || {};
                  return { ...subItem, ...childFiles };
                });
              } else if (target && typeof target === "object" && target.id) {
                // Target is single object
                const childFiles = filesByEntity[target.id] || {};
                item[lastPart] = { ...target, ...childFiles };
              } else if (parts.length === 1 && item.id) {
                // Direct array item
                const childFiles = filesByEntity[item.id] || {};
                current[i] = { ...item, ...childFiles };
              }
            }
          } else if (current[lastPart]) {
            // Handle nested field (array or single object)
            const target = current[lastPart];

            if (Array.isArray(target)) {
              // Target is array - attach files to each item
              current[lastPart] = target.map((item: any) => {
                if (!item || !item.id) return item;
                const childFiles = filesByEntity[item.id] || {};
                return { ...item, ...childFiles };
              });
            } else if (target && typeof target === "object" && target.id) {
              // Target is single object
              const childFiles = filesByEntity[target.id] || {};
              current[lastPart] = { ...target, ...childFiles };
            }
          }
        }
      }

      return entAny as T;
    } catch (error) {
      // Silent fail - không ảnh hưởng query chính
      logger.warn(`Failed to attach files to entity ${entity.id}:`, error);
      return entity;
    }
  }

  /**
   * Attach files to multiple entities
   * Tự động gọi khi query danh sách entities
   */
  private async attachFilesToEntities(
    entities: (T & { id?: string })[],
  ): Promise<T[]> {
    if (!entities || entities.length === 0) {
      return entities;
    }

    try {
      const collectedIds: string[] = [];

      // Helper function to get value from path
      const getValueByPath = (obj: any, path: string): any[] => {
        const parts = path.split(".");
        let current: any = obj;

        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];

          if (!current) {
            return [];
          }

          // If current is an array, map over each item to get the property
          if (Array.isArray(current)) {
            const mapped = current
              .map((item) => item?.[part])
              .filter((val) => val !== null && val !== undefined);
            current = mapped;
          } else {
            // Normal object property access
            current = current[part];

            if (!current) {
              return [];
            }
          }
        }

        // Flatten if result is nested array
        if (Array.isArray(current)) {
          return current.flat();
        }
        if (current && typeof current === "object") {
          return [current];
        }
        return [];
      };

      // Collect all entity IDs
      for (const e of entities) {
        if (e.id) collectedIds.push(e.id as string);

        // Collect nested IDs based on nestedFileFields
        if (this.nestedFileFields && this.nestedFileFields.length > 0) {
          for (const fieldPath of this.nestedFileFields) {
            const values = getValueByPath(e, fieldPath);

            for (const item of values) {
              if (item && typeof item === "object" && item.id) {
                collectedIds.push(item.id);
              }
            }
          }
        }
      }

      const uniqueIds = Array.from(new Set(collectedIds));
      if (uniqueIds.length === 0) return entities;

      // Get File repository from store schema
      const fileRepo = this.dataSource.getRepository("File");
      const allFiles = await fileRepo.find({
        where: {
          entityId: In(uniqueIds),
          status: FileStatusEnum.ACTIVE,
          deletedAt: null,
        } as any,
        order: { createdAt: "ASC" } as any,
      });

      if (allFiles.length > 0) {
        allFiles.slice(0, 5).forEach((f: any) => {});
        if (allFiles.length > 5) {
        }
      }

      // Group files by entityId and category
      const filesByEntity: Record<string, Record<string, any[]>> = {};

      for (const file of allFiles) {
        const entityId = (file as any).entityId;
        if (!entityId) continue;

        if (!filesByEntity[entityId]) {
          filesByEntity[entityId] = {};
        }

        const category = (file as any).category || "uncategorized";
        if (!filesByEntity[entityId][category]) {
          filesByEntity[entityId][category] = [];
        }

        filesByEntity[entityId][category].push(file);
      }

      // Attach files to root entities and nested entities
      return entities.map((entity) => {
        if (!entity.id) return entity;

        const entAny: any = { ...entity };

        // Attach files to root entity
        if (entity.id && filesByEntity[entity.id]) {
          Object.assign(entAny, filesByEntity[entity.id]);
        }

        // Attach files to nested entities based on paths
        if (this.nestedFileFields && this.nestedFileFields.length > 0) {
          for (const fieldPath of this.nestedFileFields) {
            const parts = fieldPath.split(".");
            let current: any = entAny;

            // Navigate to parent of target field
            for (let i = 0; i < parts.length - 1; i++) {
              if (!current[parts[i]]) break;
              current = current[parts[i]];
            }

            const lastPart = parts[parts.length - 1];

            // Attach files to array items
            if (Array.isArray(current)) {
              for (let i = 0; i < current.length; i++) {
                const item = current[i];
                if (!item) continue;

                const target = parts.length === 1 ? item : item[lastPart];

                if (Array.isArray(target)) {
                  // Target is array
                  item[lastPart] = target.map((subItem: any) => {
                    if (!subItem || !subItem.id) return subItem;
                    const childFiles = filesByEntity[subItem.id] || {};
                    return { ...subItem, ...childFiles };
                  });
                } else if (target && typeof target === "object" && target.id) {
                  // Target is single object
                  const childFiles = filesByEntity[target.id] || {};
                  item[lastPart] = { ...target, ...childFiles };
                } else if (parts.length === 1 && item.id) {
                  // Direct array item
                  const childFiles = filesByEntity[item.id] || {};
                  current[i] = { ...item, ...childFiles };
                }
              }
            } else if (current[lastPart]) {
              // Handle nested field (array or single object)
              const target = current[lastPart];

              if (Array.isArray(target)) {
                // Target is array - attach files to each item
                current[lastPart] = target.map((item: any) => {
                  if (!item || !item.id) return item;
                  const childFiles = filesByEntity[item.id] || {};
                  return { ...item, ...childFiles };
                });
              } else if (target && typeof target === "object" && target.id) {
                // Target is single object
                const childFiles = filesByEntity[target.id] || {};
                current[lastPart] = { ...target, ...childFiles };
              }
            }
          }
        }

        return entAny as T;
      });
    } catch (error) {
      // Silent fail - không ảnh hưởng query chính
      logger.warn(
        `Failed to attach files to ${entities.length} entities:`,
        error,
      );
      return entities;
    }
  }

  /**
   * Handle files after entity creation
   * Chuyển files từ tempId sang realId và active
   * Tự động xử lý nested entities thông qua nestedFileFields
   */
  protected async handleFilesAfterCreate(
    entityId: string,
    tempId: string,
    savedEntity?: any,
  ): Promise<void> {
    if (!tempId) return;

    try {
      const fileRepo = this.dataSource.getRepository("File");

      // Update files with tempId to have entityId = entity.id and status = ACTIVE
      const result = await fileRepo.update(
        { entityId: tempId },
        {
          entityId: entityId,
          status: FileStatusEnum.ACTIVE,
          expiredAt: null,
        },
      );

      logger.info(
        `Updated ${result.affected} files from tempId ${tempId} to entityId ${entityId}`,
      );
      logger.info(
        `Updated files from tempId ${tempId} to entityId ${entityId}`,
      );

      if (
        savedEntity &&
        this.nestedFileFields &&
        this.nestedFileFields.length > 0
      ) {
        for (const fieldKey of this.nestedFileFields) {
          const nestedData = savedEntity[fieldKey];

          if (Array.isArray(nestedData) && nestedData.length > 0) {
            for (const nestedItem of nestedData) {
              if (nestedItem && nestedItem.id && nestedItem.tempId) {
                await fileRepo.update(
                  { entityId: nestedItem.tempId },
                  {
                    entityId: nestedItem.id,
                    status: FileStatusEnum.ACTIVE,
                    expiredAt: null,
                  },
                );
                logger.info(
                  `Updated files from tempId ${nestedItem.tempId} to entityId ${nestedItem.id} for nested field ${fieldKey}`,
                );
              }
            }
          } else if (
            nestedData &&
            nestedData.id &&
            nestedData.tempId &&
            typeof nestedData === "object"
          ) {
            await fileRepo.update(
              { entityId: nestedData.tempId },
              {
                entityId: nestedData.id,
                status: FileStatusEnum.ACTIVE,
                expiredAt: null,
              },
            );
            logger.info(
              `Updated files from tempId ${nestedData.tempId} to entityId ${nestedData.id} for nested field ${fieldKey}`,
            );
          }
        }
      }
    } catch (error) {
      logger.warn(
        `Failed to handle files after create for entity ${entityId}:`,
        error,
      );
    }
  }
}
