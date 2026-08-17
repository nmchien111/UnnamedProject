import { BaseEntity } from "@/shared/base/BaseEntity";
import { User } from "./User";
import { Entity, Column, OneToMany } from "typeorm";

export const PERMISSIONS = ["create", "read", "update", "delete"] as const;

export const MODULES = [
  // TODO: Danh mục
  "user",
  "role",
  "category",
  "warehouse",
  "order",
  "sku",
  "dashboard",
  "product",
  "store",
  "supplier",
  "customer",
  "inventoryBatch",
  "purchaseOrder",
  "inventoryAdjustment",
  "storeTransfer",
  "goodsIssue",
  "fund",
  "fundTransaction",
  "debtLedger",
  "overview",
  "profit",
  "report",
  "debt",
] as const;

export enum RoleTypeEnum {
  SYSTEM = "system",
  STORE = "store",
}

export type Permission = (typeof PERMISSIONS)[number];

export type Module = (typeof MODULES)[number];

// Interface để định nghĩa cấu trúc permissions
export type PermissionStructure = {
  [key in Module]?: Permission[];
};

@Entity("roles")
export class Role extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  name: string; // Tên của role

  @Column({ type: "varchar", length: 255, nullable: true })
  code: string | null; // Mã định danh duy nhất cho role, có thể dùng để phân quyền trong code

  @Column({ type: "enum", enum: RoleTypeEnum, default: RoleTypeEnum.STORE })
  type: RoleTypeEnum; // Phạm vi của role

  @Column({ type: "jsonb", default: {} })
  permissions!: PermissionStructure; // Cấu trúc permissions theo module

  @OneToMany(() => User, (user) => user.role)
  users: User[]; // Danh sách người dùng thuộc role này

  userCount?: number;
}
