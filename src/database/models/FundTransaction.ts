import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import {
  BaseEntity,
  BaseNumericColumnOptions,
} from "../../shared/base/BaseEntity";
import { FundTransactionTypeEnum } from "../../shared/constants/enum";
import { Driver } from "./Driver";
import { Trip } from "./Trip";
import { FundDeposit } from "./FundDeposit";

@Entity("fund_transactions")
export class FundTransaction extends BaseEntity {
  @Column({ type: "enum", enum: FundTransactionTypeEnum })
  @Index()
  type: FundTransactionTypeEnum; // Phân loại giao dịch: DEPOSIT, WITHDRAW, PURCHASE, REFUND

  @Column({ ...BaseNumericColumnOptions })
  amount: number; // Số tiền biến động (Luôn là số dương, việc cộng hay trừ phụ thuộc vào cột `type`)

  @Column({ ...BaseNumericColumnOptions })
  balanceAfter: number; // Số dư ví tài xế NGAY SAU KHI giao dịch (Biến thiên lịch sử số dư)

  @Column({ type: "varchar", length: 255 })
  description: string; // Diễn giải (VD: "Thu phí chiết khấu cuốc xe TRIP-123", "Nạp tiền ví")

  // ================= RELATIONS ================= //

  @Column({ type: "uuid" })
  @Index()
  driverId: string; // Giao dịch này tác động lên ví của tài xế nào

  @ManyToOne(() => Driver, { onDelete: "CASCADE" })
  @JoinColumn({ name: "driverId" })
  driver: Driver;

  // --- NGUỒN GỐC GIAO DỊCH (Traceability) ---

  @Column({ type: "uuid", nullable: true })
  @Index()
  tripId: string | null; // Nếu type = PURCHASE (Thu phí cuốc xe), cột này sẽ lưu ID của cuốc xe đó

  @ManyToOne(() => Trip, { onDelete: "SET NULL" })
  @JoinColumn({ name: "tripId" })
  trip: Trip | null;

  @Column({ type: "uuid", nullable: true })
  @Index()
  fundDepositId: string | null; // Nếu type = DEPOSIT (Nạp tiền), cột này sẽ lưu ID của lệnh nạp

  @ManyToOne(() => FundDeposit, { onDelete: "SET NULL" })
  @JoinColumn({ name: "fundDepositId" })
  fundDeposit: FundDeposit | null;
}
