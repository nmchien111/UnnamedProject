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
  ): Promise<{ data: T[]; total: number; sumary?: any }> {
    const page = options.skip? || 1;
    const size = options.take || 20;
    
    const repo = this.getRepository(manager);
    const qb = repo.createQueryBuilder("entity");

    // Join relations: ưu tiên relationsForList cho list query
    const defaultRelations = this.relationsForList || this.relations;
    const allRelations = { ...defaultRelations, ...options.relations };
    if (allRelations && Object.keys(allRelations).length > 0) {
      this.joinRelations(qb, allRelations, "entity");
    }
    
    if (options.keyword ){
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
        .filter ((col) => {
          const type = col.type;
          return (
            type === String ||
            ["varchar", "text", "nvarchar", "longtext"].includes(type as string)
          );
        })
        .map((col) => `entity.${col.propertyName}`);

        textSearchableFields.push(...autoDetectedFields);

        const allRelations = {... this.relations, ...options.relations};
        if (allRelations){
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
    if(options.storeId){
      const entityMetadata = repo.metadata;
      const hasTenantIdColumn = entityMetadata.columns.some(
        (col) => col.propertyName === 'storeId'
      );
      if(hasTenantIdColumn){
        qb.andWhere('entity.storeId = :storeId', { 
          storeId: options.storeId 
        });
      }
    }

    // ===== Range Filters (Gte, Gt, Eq, Lte, Lt) =====
    // Xử lý các trường range filter từ moreQuery hoặc options
    const rangeFilterSource = options.moreQuery || options;

    if( rangeFilterSource && typeof rangeFilterSource === "object") {
      const entityMetadata = repo.metadata;
      const entityColumns = entityMetadata.columns.map(col => col.propertyName);

      Object.keys(rangeFilterSource).forEach((key) => {
        const matchedSuffix = rangeSuffixes.find(suffix => key.endsWith(suffix));
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
      })
    }  
  }

  
}
