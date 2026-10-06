import { User } from "./User";
import { Entity, Column, OneToOne, JoinColumn, Index } from "typeorm";
import { BaseEntity, BaseNumericColumnOptions } from "@/shared/base/BaseEntity";
import { VehicleTypeEnum, DriverLockTypeEnum } from "@/shared/constants/enum";

@Entity({ name: "drivers" })
export class Driver extends BaseEntity {
  // ================= THÔNG TIN CƠ BẢN ================= //
  @Column({ type: "varchar", length: 255 })
  name: string; // Tên tài xế

  @Column({ type: "varchar", length: 50, unique: true })
  code: string; // Mã tài xế (VD: DRIVER-2610-001)

  @Column({ type: "varchar", length: 20, unique: true })
  phone: string; // Số điện thoại của tài xế

  // ================= QUẢN LÝ PHƯƠNG TIỆN ================= //

  @Column({ type: "varchar", length: 20, unique: true })
  @Index()
  licensePlate: string; // Biển số xe

  @Column({ type: "enum", enum: VehicleTypeEnum })
  vehicleType: VehicleTypeEnum; // SEAT4, SEAT5, SEAT7...

  @Column({ type: "varchar", length: 100 })
  vehicleName: string; // Hãng và dòng xe (VD: Toyota Vios)

  @Column({ type: "varchar", length: 50, nullable: true })
  vehicleColor: string | null; // Màu xe

  // ================= BẰNG LÁI & NGHIỆP VỤ ================= //

  @Column({ type: "varchar", length: 20, nullable: true })
  licenseNumber: string | null; // Số Giấy phép lái xe

  @Column({ type: "varchar", length: 10, nullable: true })
  licenseClass: string | null; // Hạng bằng (B1, B2...)

  // ================= VẬN HÀNH & ĐIỀU PHỐI ================= //

  @Column({
    type: "enum",
    enum: DriverLockTypeEnum,
    default: DriverLockTypeEnum.UNLOCK,
  })
  @Index()
  lockStatus: DriverLockTypeEnum; // Trạng thái khóa tài khoản từ Admin (LOCK / UNLOCK)

  @Column({ type: "boolean", default: false })
  @Index()
  isOnline: boolean; // Trạng thái tài xế bật/tắt app để nhận cuốc

  @Column({ type: "numeric", precision: 10, scale: 7, nullable: true })
  currentLat: number | null; // Vĩ độ hiện tại

  @Column({ type: "numeric", precision: 10, scale: 7, nullable: true })
  currentLng: number | null; // Kinh độ hiện tại

  // ================= THỐNG KÊ & VÍ ĐIỆN TỬ ================= //

  @Column({ ...BaseNumericColumnOptions, default: 0 })
  walletBalance: number; // Số dư ví

  @Column({ type: "numeric", precision: 3, scale: 1, default: 5.0 })
  rating: number; // Điểm đánh giá

  @Column({ type: "int", default: 0 })
  totalTrips: number; // Tổng số cuốc xe đã hoàn thành

  // ================= RELATIONS ================= //

  @Column({ type: "uuid", unique: true })
  userId: string;

  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
}
