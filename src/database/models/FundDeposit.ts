import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import {
  BaseEntity,
  BaseNumericColumnOptions,
} from "../../shared/base/BaseEntity";
import { Fund } from "./Fund";
import { Driver } from "./Driver";
import { DepositStatusEnum } from "../../shared/constants/enum";

@Entity("fund_deposits")
export class FundDeposit extends BaseEntity {
  @Column({ type: "varchar", length: 50, unique: true })
  @Index()
  code: string; // Mã lệnh nạp tiền nội bộ (VD: DEP-2610-001)

  @Column({ ...BaseNumericColumnOptions })
  amount: number; // Số tiền tài xế yêu cầu nạp

  @Column({ ...BaseNumericColumnOptions, nullable: true })
  transferAmount: number | null; // Số tiền thực tế tài xế đã chuyển (hệ thống hoặc kế toán ghi nhận sau khi đối soát)

  @Column({ type: "varchar", length: 100, nullable: true })
  transactionCode: string | null; // Mã giao dịch trả về từ ngân hàng (Mã FT/Tham chiếu)

  @Column({
    type: "enum",
    enum: DepositStatusEnum,
    default: DepositStatusEnum.PENDING,
  })
  @Index()
  status: DepositStatusEnum; // Trạng thái lệnh nạp: PENDING, COMPLETED, FAILED

  @Column({ type: "text", nullable: true })
  qrCode: string | null; // Chuỗi URL hoặc Data URL lưu trữ mã QR tĩnh/động cho riêng lệnh nạp này

  // ================= RELATIONS ================= //

  @Column({ type: "uuid" })
  @Index()
  fundId: string; // Trỏ về tài khoản ngân hàng thụ hưởng của công ty

  @ManyToOne(() => Fund, { onDelete: "RESTRICT" }) // Không cho phép xóa Fund nếu đang có lệnh nạp treo
  @JoinColumn({ name: "fundId" })
  fund: Fund;

  @Column({ type: "uuid" })
  @Index()
  driverId: string; // Trỏ về tài xế thực hiện lệnh nạp tiền vào quỹ

  @ManyToOne(() => Driver, { onDelete: "CASCADE" }) // Tránh rác dữ liệu nếu tài khoản tài xế bị xóa bỏ
  @JoinColumn({ name: "driverId" })
  driver: Driver;
}
