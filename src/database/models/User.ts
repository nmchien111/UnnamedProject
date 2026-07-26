import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { BaseEntity } from "../../shared/base/BaseEntity";
import { Address } from "../../shared/base/BaseValidator";
import { GenderEnum } from "../../shared/constants/enum";

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

  @Column({ type: "text", nullable: true, default: null })
  note: string | null;

  @Column({ type: "uuid", nullable: true, default: null })
  positionId: string | null;

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

  @Column({ type: "uuid", nullable: true, default: null })
  storeId: string | null; // id của cửa hàng mà user thuộc về, null nếu user là admin hệ thống
}
