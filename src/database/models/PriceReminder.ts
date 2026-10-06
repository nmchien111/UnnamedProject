import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import {
  BaseEntity,
  BaseNumericColumnOptions,
} from "../../shared/base/BaseEntity";
import { Trip } from "./Trip";
import { Driver } from "./Driver";

@Entity("price_reminders")
export class PriceReminder extends BaseEntity {
  @Column({ ...BaseNumericColumnOptions })
  price: number; // Mức giá được nhắc/chào riêng cho tài xế

  @Column({ type: "boolean", default: false })
  @Index()
  isNotified: boolean; // Đánh dấu đã gửi Push Notification thành công hay chưa

  // ================= RELATIONS ================= //

  @Column({ type: "uuid" })
  @Index()
  tripId: string;

  @ManyToOne(() => Trip, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tripId" })
  trip: Trip;

  @Column({ type: "uuid" })
  @Index()
  driverId: string;

  @ManyToOne(() => Driver, { onDelete: "CASCADE" })
  @JoinColumn({ name: "driverId" })
  driver: Driver;
}
