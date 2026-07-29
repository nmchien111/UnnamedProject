import { Entity, Column, Index } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import {
  EntityTypeEnum,
  FileCategoryEnum,
  FileStatusEnum,
  FileTypeEnum,
} from "@/shared/constants/enum";

// ============================== ATTRIBUTE ENTITIES ==============================
@Entity("files")
export class File extends BaseEntity {
  @Column({ type: "varchar", length: 255, unique: true })
  fileName: string; // Tên file đã mã hóa.
  @Column({ type: "varchar", length: 255 })
  originalName: string; // Tên file gốc do user uploads (VD: baocao.pdf,...)
  @Column({ type: "varchar", length: 1024 })
  path: string; // Đường dẫn vật lý.
  @Column({ type: "varchar", length: 1024 })
  url: string; // Đường dẫn tuyệt đối đã bao gồm CDN Domain.
  @Column({ type: "bigint" })
  size: number; // Dung lượng của file
  @Column({ type: "enum", enum: FileTypeEnum })
  type: FileTypeEnum; // Định dạng vật lý (image, video, document) để Frontend biết dùng thẻ HTML tương ứng

  @Column({ type: "enum", enum: EntityTypeEnum, nullable: true })
  entityType: EntityTypeEnum | null; // Tên bảng sở hữu file này (VD: product, user,...)
  @Column({ type: "uuid", nullable: true })
  entityId: string | null; //Khóa chính của thực thể sở hữu file
  @Column({ type: "uuid", nullable: true, default: null })
  storeId: string; //Mã định danh cửa hàng để cô lập dữ liệu

  @Column({ type: "varchar", length: 1024, nullable: true })
  thumbnailPath: string;
  @Column({ type: "varchar", length: 1024, nullable: true })
  thumbnailUrl: string; // Link ảnh thu nhỏ Frontend nên dùng link này ở trang danh sách để tăng tốc độ tải trang, chỉ dùng `url` gốc ở trang chi tiết..

  @Column({ type: "enum", enum: FileCategoryEnum })
  category: FileCategoryEnum; // Phân loại nghiệp vụ của file (VD: avatar, recipt, gallery,...)
  @Column({ type: "boolean", default: true })
  isPublic: boolean;
  @Column({ type: "boolean", default: false })
  isMain: boolean; // Xác định ảnh chính của 1 nhóm file
  @Column({ type: "varchar", length: 255, nullable: true })
  alt: string | null; // Văn bản thay thế

  @Index(["storeId", "status"])

  /**
   * - PENDING: Vừa upload (Chờ user lưu form). Cronjob sẽ xóa nếu PENDING > 24h.
   * - ACTIVE: File đang được sử dụng chính thức.
   */
  @Column({
    type: "enum",
    enum: FileStatusEnum,
    default: FileStatusEnum.PENDING,
  })
  status: FileStatusEnum;

  @Column({ type: "timestamptz", nullable: true, default: null })
  expiresAt: Date | null; // Thời điểm file sẽ bị hệ thống tự động xóa bỏ
}
