import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { BaseEntity } from "../../shared/base/BaseEntity";
import { Address } from "../../shared/base/BaseValidator";
import { GenderEnum } from "../../shared/constants/enum";
import { Role } from "./Role";

import { UserNotification } from "./UserNotification";

@Entity({ name: "users" })
export class User extends BaseEntity {
  @Column({ type: "varchar", length: 50, nullable: true })
  code: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  username: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  password: string | null;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "boolean", default: true })
  canLogin: boolean;

  @Column({ type: "varchar", length: 255, nullable: true, default: null })
  email: string | null;

  @Column({ type: "jsonb", nullable: true, default: null })
  address: Address | null; // danh sách địa chỉ

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
    default: null,
  })
  phone: string | null;

  @Column({ type: "timestamptz", nullable: true, default: null })
  dob: Date | null; // ngày sinh

  @Column({ type: "boolean", default: true })
  isActive: boolean; // trạng thái hoạt động của user

  @Column({ type: "enum", enum: GenderEnum, nullable: true, default: null })
  gender: GenderEnum | null; // giới tính

  @Column({ type: "uuid", nullable: true, default: null })
  roleId: string | null; // id của role

  @ManyToOne(() => Role, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "roleId" })
  role: Role; // role của user, không thể null vì user phải có role

  @OneToMany(() => UserNotification, (notification) => notification.user)
  userNotifications?: UserNotification[];
}
