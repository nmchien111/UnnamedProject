import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseEntity } from "../../shared/base/BaseEntity";
import { Driver } from "./Driver";
import { DriverLockTypeEnum } from "../../shared/constants/enum";

@Entity("driver_locks")
export class DriverLock extends BaseEntity {
  @Column({ type: "enum", enum: DriverLockTypeEnum })
  type: DriverLockTypeEnum; // Loại thao tác: LOCK hoặc UNLOCK

  @Column({ type: "timestamptz" })
  @Index()
  timeAt: Date; // Thời điểm thực hiện khóa/mở khóa

  // ================= RELATIONS ================= //

  @Column({ type: "uuid" })
  @Index()
  driverId: string; // Bắt buộc phải gắn với một tài xế

  @ManyToOne(() => Driver, { onDelete: "CASCADE" })
  @JoinColumn({ name: "driverId" })
  driver: Driver;
}
