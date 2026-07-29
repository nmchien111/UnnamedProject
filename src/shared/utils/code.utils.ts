import { EntityTarget, In, ObjectLiteral } from "typeorm";
import { ValidationError } from "../types/errors";
import { ErrorsMessages } from "../constants/errors";
import DatabaseConfig from "@/config/database";
import logger from "./logger";
import { Request, Response } from "express";

/**
 * Bản đồ lưu trữ luật sinh mã mặc định cho các Entity.
 * Ví dụ: Product -> { prefix: 'SP', length: 5 }
 */
export const prefixMap = new Map<
  EntityTarget<ObjectLiteral>,
  { prefix: string; length: number }
>([]);

/**
 * Bản đồ lưu trữ luật sinh mã ngoại lệ (dành cho các loại đặc thù của cùng 1 Entity).
 * Ví dụ: Product nhưng loại 'DienTu' -> { prefix: 'DT', length: 5 }
 */
export const exceptionMap = new Map<
  string,
  { prefix: string; length: number }
>();

/**
 * Bản đồ ánh xạ từ chuỗi string (từ Frontend) sang đối tượng Class Entity của backend.
 * Ví dụ: 'product' -> Product (Class)
 */
const typeToEntityMap = new Map<string, EntityTarget<ObjectLiteral>>([]);

/**
 * Hàm tìm kiếm Entity tương ứng dựa vào chuỗi 'type' Frontend gửi lên.
 * Có hỗ trợ tự động nhận diện chữ thường/chữ hoa và số nhiều (có đuôi 's').
 *
 * @param type Chuỗi loại thực thể (VD: "orders", "product")
 * @returns Đối tượng EntityTarget của TypeORM hoặc undefined nếu không tìm thấy
 */
export const getEntityByType = (
  type: string,
): EntityTarget<ObjectLiteral> | undefined => {
  const normalizedType = type.toLowerCase();

  // Kiểm tra trong danh sách ánh xạ tùy chỉnh trước
  if (typeToEntityMap.has(normalizedType)) {
    return typeToEntityMap.get(normalizedType);
  }

  // Nếu không có, tự động quét trong prefixMap để tìm class tương ứng
  return [...prefixMap.keys()].find((key) => {
    if (typeof key === "string") {
      return (
        key.toLowerCase() === normalizedType ||
        key.toLowerCase() + "s" === normalizedType
      );
    }

    if (typeof key === "function" && "name" in key) {
      return (
        key.name.toLowerCase() === normalizedType ||
        key.name.toLowerCase() + "s" === normalizedType
      );
    }

    return false;
  });
};

/**
 * Hàm trích xuất cấu hình (tiền tố, độ dài) cho một Entity.
 * Sẽ ưu tiên lấy cấu hình ngoại lệ (exceptionMap) trước, nếu không có mới lấy cấu hình chung (prefixMap).
 * Ném ra lỗi Validation nếu Entity đó chưa được cấu hình luật sinh mã.
 *
 * @param entity Lớp Entity cần sinh mã
 * @param type Phân loại phụ (nếu có)
 */
function getConfig(entity: EntityTarget<ObjectLiteral>, type?: string) {
  if (type) {
    const entityName =
      typeof entity === "function" && "name" in entity
        ? entity.name.toLowerCase()
        : String(entity).toLowerCase();

    const exceptionKey = `${entityName}.${type.toLowerCase()}`;
    if (exceptionMap.has(exceptionKey)) {
      return exceptionMap.get(exceptionKey)!;
    }
  }

  const config = prefixMap.get(entity);
  if (!config) {
    throw <ValidationError>{
      message: "type.invalid",
      errors: [
        {
          code: ErrorsMessages.invalid,
          field: "type",
        },
      ],
    };
  }

  return config;
}

/**
 * Hàm lấy số thứ tự tiếp theo từ Database (PostgreSQL Sequence).
 * Đảm bảo an toàn tuyệt đối, không bao giờ bị trùng lặp số dù có 1000 request gọi cùng 1 phần nghìn giây.
 *
 * @param key Khóa định danh cho Sequence trong DB (VD: user_sequence)
 * @returns Con số thứ tự tiếp theo (VD: 1, 2, 3...)
 */
async function getNextSequence(key: string): Promise<number> {
  // Chuẩn hóa tên Sequence hợp lệ trong SQL (chỉ giữ lại chữ, số và dấu gạch dưới)
  const seqName = `code_seq_${key
    .replace(/\./g, "_")
    .replace(/-/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")}`;

  // Tạo bộ đếm mới trong DB nếu bộ đếm này chưa tồn tại
  await DatabaseConfig.query(
    `CREATE SEQUENCE IF NOT EXISTS "${seqName}" START 1;`,
  );

  // Rút số thứ tự tiếp theo từ bộ đếm
  const result = await DatabaseConfig.query(
    `SELECT nextval('"${seqName}"') as value;`,
  );

  return Number(result[0].value);
}

/**
 * Hàm Xưởng Lắp Ráp: Tổng hợp quy tắc (prefix, length) và số thứ tự (sequence) để tạo ra chuỗi mã hoàn chỉnh.
 *
 * @param entity Lớp Entity cần sinh mã
 * @param type Phân loại phụ của mã (VD: nhập, xuất)
 * @returns Mã duy nhất (VD: "ORD00045")
 */
export const generateCode = async <T extends ObjectLiteral>(
  entity: EntityTarget<T>,
  type: string,
): Promise<string> => {
  // 1. Lấy luật sinh mã (prefix, length)
  const config = getConfig(entity, type);
  const { prefix, length } = config;

  // 2. Lấy tên Entity để tạo khóa Sequence
  const entityName =
    typeof entity === "function" && "name" in entity
      ? entity.name.toLowerCase()
      : String(entity).toLowerCase();

  const key = type ? `${entityName}.${type.toLowerCase()}` : `${entityName}`;

  // 3. Rút số thứ tự từ Database
  const nextNumber = await getNextSequence(key);

  // 4. Lắp ráp: Tiền tố + số lượng số 0 bù vào cho đủ độ dài + số đếm
  return `${prefix}${String(nextNumber).padStart(length, "0")}`;
};

/**
 * HTTP Controller (API Endpoint) xử lý yêu cầu xin cấp mã mới từ Frontend.
 * Endpoint mong đợi: GET /api/v1/code?type=tên_thực_thể
 */
export async function getCode(req: Request, res: Response) {
  try {
    const type = req.query.type as string;

    // Validate: Bắt buộc phải có chữ 'type' trên đường dẫn
    if (!type) {
      return res.status(400).json({
        message: "type.required",
        errors: [
          {
            field: "type",
            code: ErrorsMessages.required,
          },
        ],
      });
    }

    // Validate: Thực thể type này có tồn tại trong hệ thống hay không
    const entity = getEntityByType(type);
    if (!entity) {
      return res.status(400).json({
        message: "type.invalid",
        errors: [
          {
            code: ErrorsMessages.invalid,
            field: "type",
          },
        ],
      });
    }

    // Gọi xưởng lắp ráp mã
    const code = await generateCode(entity, type);

    // Trả về JSON cho Frontend
    return res.json({
      statusCode: 200,
      data: { code },
      success: true,
      message: "code.generated",
    });
  } catch (error) {
    logger.error("Get code error:", error);
    return res.status(500).json({
      message: (error as any).message || "server.error",
      errors: (error as any).errors || [],
    });
  }
}
