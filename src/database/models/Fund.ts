import { Entity, Column } from "typeorm";
import { BaseEntity } from "../../shared/base/BaseEntity";

@Entity("funds")
export class Fund extends BaseEntity {
  @Column({ type: "varchar", length: 255 })
  name: string; // Tên quỹ nội bộ (VD: Quỹ thu phí tài xế, Quỹ dự phòng)

  @Column({ type: "varchar", length: 255 })
  bankName: string; // Tên ngân hàng (VD: Vietcombank, MB Bank)

  @Column({ type: "varchar", length: 50 })
  bin: string; // Mã định danh ngân hàng (Bank Identification Number)

  @Column({ type: "varchar", length: 100 })
  accountNumber: string; // Số tài khoản ngân hàng

  @Column({ type: "varchar", length: 255 })
  accountHolder: string; // Tên người thụ hưởng/Chủ tài khoản (VD: CTY TNHH XE NOI BAI)
}
