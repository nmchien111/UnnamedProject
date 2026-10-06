import { Entity, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import {
  BaseEntity,
  BaseNumericColumnOptions,
} from "../../shared/base/BaseEntity";
import { Driver } from "./Driver";
import { Customer } from "./Customer"; // Bảng Customer thiết kế độc lập như đã chốt
import {
  TripStatusEnum,
  TripTypeEnum,
  StationTypeEnum,
  VehicleTypeEnum,
  PaymentMethodEnum,
} from "../../shared/constants/enum";
import { boolean } from "zod";
import { Address } from "@/shared/base/BaseValidator";

@Entity("trips")
export class Trip extends BaseEntity {
  // ================= THÔNG TIN CƠ BẢN ================= //

  @Column({ type: "varchar", length: 50, unique: true })
  @Index() // Cực kỳ quan trọng: Giúp tổng đài viên search mã cuốc xe trong nháy mắt
  code: string; // Mã chuyến đi (VD: TRIP-2610-001)

  @Column({ type: "enum", enum: TripTypeEnum })
  type: TripTypeEnum; // Loại chuyến: Đón (PICK_UP) hoặc Tiễn (FARE_WELL)

  @Column({ type: "boolean", default: false })
  isRoundTrip: boolean; // Có phải 2 chiều hay không

  @Column({ type: "enum", enum: StationTypeEnum, nullable: true })
  stationType: StationTypeEnum | null; // Sảnh Nội địa (INTERNAL) hay Quốc tế (INTERNATIONAL)

  @Column({ type: "numeric" })
  seatCount: number;

  @Column({ type: "varchar", length: 50, nullable: true })
  flightInfo: string | null; // Mã chuyến bay (VD: VN210) - Rất quan trọng để tài xế canh giờ máy bay delay

  @Column({
    type: "enum",
    enum: TripStatusEnum,
    default: TripStatusEnum.PENDING,
  })
  @Index()
  status: TripStatusEnum; // PENDING (Chờ nhận), PURCHASED (Tài xế đã nhận/mua cuốc), CANCELLED (Hủy)

  // ================= LỘ TRÌNH & THỜI GIAN ================= //

  @Column({ type: "timestamptz" })
  @Index()
  timeAt: Date; // Thời gian đón khách dự kiến

  @Column({ type: "jsonb", nullable: false })
  addressBooking: Address; // Địa chỉ đón khách (VD: Số 1, Trần Hưng Đạo, Hoàn Kiếm, Hà Nội)

  @Column({ type: "numeric", precision: 8, scale: 2, nullable: true })
  distance: number | null; // Khoảng cách ước tính (Đơn vị: km)

  @Column({ type: "enum", enum: VehicleTypeEnum })
  vehicleType: VehicleTypeEnum; // Khách yêu cầu xe mấy chỗ (SEAT4, SEAT7...)

  // ================= TÀI CHÍNH & THANH TOÁN ================= //

  @Column({ ...BaseNumericColumnOptions })
  price: number; // Tổng cước phí chuyến đi

  @Column({
    type: "enum",
    enum: PaymentMethodEnum,
    default: PaymentMethodEnum.CASH,
  })
  paymentMethod: PaymentMethodEnum; // Trả tiền mặt, chuyển khoản, hay quẹt thẻ

  @Column({ ...BaseNumericColumnOptions, nullable: false })
  amountCollected: number; // Số tiền tài xế đã thu của khách (Có thể khác với giá cước chuyến đi nếu khách trả thừa hoặc trả thiếu)

  @Column({ type: "boolean", default: false })
  isCustomerPaid: boolean; // Đánh dấu khách đã thanh toán hay chưa

  // ================= RELATIONS (LIÊN KẾT BẢNG) ================= //

  // 1. Liên kết với Khách hàng (Bắt buộc phải có ngay khi tạo cuốc)
  @Column({ type: "uuid" })
  @Index()
  customerId: string;

  @ManyToOne(() => Customer, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "customerId" })
  customer: Customer;

  // 2. Liên kết với Tài xế (Có thể Null nếu cuốc vừa tạo, chưa có ai nhận)
  @Column({ type: "uuid", nullable: true })
  @Index()
  driverId: string | null;

  @ManyToOne(() => Driver, { onDelete: "SET NULL" })
  @JoinColumn({ name: "driverId" })
  driver: Driver | null;
}
