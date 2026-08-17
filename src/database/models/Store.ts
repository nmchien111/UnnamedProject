import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntity } from "@/shared/base/BaseEntity";
import { User } from "./User";
import { Address } from "@/shared/base/BaseValidator";

@Entity("stores")
export class Store extends BaseEntity {
  @Column({ type: "varchar", length: 255, unique: true })
  code: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  // Đổi sang jsonb
  @Column({ type: "jsonb", nullable: true })
  image: any[] | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  email: string | null;

  @Column({ type: "varchar", length: 255, nullable: false })
  phone: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  taxCode: string | null;

  // Đổi sang jsonb
  @Column({ type: "jsonb", nullable: false })
  address: Address;

  @Column({ type: "int", nullable: true })
  kpiTargets: number | null;

  @Column({ type: "boolean", default: true })
  isActive: boolean;

  userCount?: number;

  @OneToMany(() => User, (user) => user.store)
  users: User[]; //Danh sách người dùng thuộc về store này
}
