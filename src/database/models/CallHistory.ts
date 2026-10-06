import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { BaseEntity } from "../../shared/base/BaseEntity";
import { Driver } from "./Driver";
import { Customer } from "./Customer";

@Entity("call_histories")
export class CallHistory extends BaseEntity {
  @Column({ type: "timestamptz" })
  @Index()
  startTime: Date; // Thời gian bắt đầu cuộc gọi

  @Column({ type: "timestamptz", nullable: true })
  endTime: Date | null; // Thời gian kết thúc cuộc gọi

  @Column({ type: "varchar", length: 20 })
  phone: string; // Số điện thoại của người gọi

  @Column({ type: "varchar", length: 20 })
  receiverPhoneNumber: string; // Số điện thoại của người nghe

  // ================= RELATIONS ================= //

  @Column({ type: "uuid", nullable: true })
  @Index()
  driverId: string | null; // Trỏ đến tài xế (nếu có)

  @ManyToOne(() => Driver, { onDelete: "SET NULL" })
  @JoinColumn({ name: "driverId" })
  driver: Driver | null;

  @Column({ type: "uuid", nullable: true })
  @Index()
  customerId: string | null; // Trỏ đến khách hàng (nếu có)

  @ManyToOne(() => Customer, { onDelete: "SET NULL" })
  @JoinColumn({ name: "customerId" })
  customer: Customer | null;
}
