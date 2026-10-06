import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import {
  BaseEntity,
  BaseNumericColumnOptions,
} from "../../shared/base/BaseEntity";
import { Address } from "@/shared/base/BaseValidator";

export interface CustomerSnapshot {
  id: string;
  name: string;
  phoneNumber: string;
  address: string;
}

@Entity({ name: "customers" })
export class Customer extends BaseEntity {
  @Column({ type: "varchar", length: 255, nullable: true })
  name: string; // Tên khách hàng

  @Column({ type: "varchar", length: 50, nullable: false })
  code: string; // Mã khách hàng

  @Column({ type: "timestamptz", nullable: true, default: null })
  dob: Date | null;

  @Column({ type: "varchar", length: 255, nullable: true, unique: true })
  phoneNumber: string; // Số điện thoại của khách hàng

  @Column({ type: "jsonb", nullable: true, default: null })
  address: Address | null; // Địa chỉ của khách hàng
}
