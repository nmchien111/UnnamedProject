import { injectable } from "inversify";
import { FindManyOptions, ObjectLiteral } from "typeorm";
import { BaseRepository } from "./BaseRepository";
import { File } from "buffer";
import { FileHelper } from "../utils/file.helper";
import da from "zod/v4/locales/da.js";

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
  warehouseId?: string; // Example field for filtering by project ID
  employeeId?: string; // Example field for filtering by employee ID
  fundId?: string; // Example field for filtering by fund ID
  advanceId?: string; // Example field for filtering by advance ID

  productIds?: string[]; // Example field for filtering by product IDs
  warehouseIds?: string[]; // Example field for filtering by store IDs
  employeeIds?: string[]; // Example field for filtering by employee IDs
  fundCategoryIds?: string[]; // Example field for filtering by fundCategory IDs
  partnerIds?: string[]; // Example field for filtering by partner IDs
  toFundIds?: string[]; // Example field for filtering by fund IDs
}

export type DateInput = Date | string | number | null | undefined;

@injectable()
export abstract class BaseService<T extends ObjectLiteral> {
  protected abstract repository: BaseRepository<T>;

  // Optional unique fields and scope to enforce DB-level uniqueness
  protected uniqueFields?: (keyof T)[];
  protected uniqueScope?: (keyof T)[];

  // Optional searchable fields for text search (keyword)
  // If not set, repository will auto-detect string fields
  protected timeField?: keyof T & string;
  protected searchableFields?: string[];
  protected summaryFields?: string[];

  /**
   * Override trong subclass để disable file attachment
   * @default true
   */
  protected shouldAttachFiles(): boolean {
    return true;
  }

  // Attach files vào 1 entity (tự động gọi nếu shouldAttachFiles = true)
  protected async attachFileToEntity(
    entity: T | null,
  ): Promise<(T & Record<string, File[]>) | null> {
    if (!entity) return null;
    const grouped = FileHelper.attachFilesToEntity(entity.id);

    return {
      ...entity,
      ...grouped,
    };
  }

  // Confirm files sau khi tạo entity (tempId → realId)
  protected async confirmEntityFiles(
    tempId: string,
    realId: string,
  ): Promise<void> {
    await FileHelper.confirmEntityFiles(tempId, realId);
  }

  protected async attachMoreDataToEntities(
    entities: T[],
    options: IFindOptions<T>,
  ): Promise<void> {
    // Override in subclass if needed
  }

  protected async attachMoreDataToEntity(
    entity: T,
    req?: Request,
  ): Promise<void> {
    // Override in subclass if needed
  }

  /**
   * Find all
   */
  async findAll(options: FindManyOptions): Promise<T[]> {
    const data = await this.repository.find(options);
    const json = JSON.stringify(data);
    const sizeInKB = Buffer.byteLength(json, "utf8") / 1024;
    logger.info(`Response size: ${sizeInKB}KB`);
    await this.attachMoreDataToEntities(data, {});

    return data;
  }
}
