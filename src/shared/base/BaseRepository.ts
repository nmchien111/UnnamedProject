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
}
