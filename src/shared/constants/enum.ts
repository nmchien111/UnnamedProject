export enum GenderEnum {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export enum EntityTypeEnum {
  ITEM = "item",
  PRODUCT = "product",
  SKU = "sku",
  AUTH = "auth",
  USER = "user",
  ROLE = "role",
  CUSTOMER = "customer",
  ATTRIBUTE = "attribute",
  ORDER = "order",
  WAREHOUSE = "warehouse",
  STORE = "store",
  PRESCRIPTION = "prescription", // Đơn thuốc
  NOTIFICATION = "notification",
}

// Trạng thái chuyến đi
export enum TripStatusEnum {
  PENDING,
  PURCHASED,
  CANCELLED,
}

// Loại chuyến
export enum TripTypeEnum {
  FARE_WELL,
  PICK_UP,
} // Tiễn / Đón

// Loại xe theo số ghế
export enum VehicleTypeEnum {
  SEAT4 = "4_SEAT",
  SEAT5 = "5_SEAT",
  SEAT7 = "7_SEAT",
  SEAT16 = "16_SEAT",
  SEAT29 = "29_SEAT",
  SEAT32 = "32_SEAT",
}

// Nhà ga sân bay
export enum StationTypeEnum {
  INTERNAL,
  INTERNATIONAL,
}

// Khóa tài xế
export enum DriverLockTypeEnum {
  LOCK,
  UNLOCK,
}

// Nạp tiền
export enum DepositStatusEnum {
  PENDING,
  COMPLETED,
  FAILED,
}

// Giao dịch quỹ nội bộ
export enum FundTransactionTypeEnum {
  DEPOSIT,
  WITHDRAW,
  PURCHASE,
  REFUND,
}

// Thông báo
export enum NotificationTypeEnum {
  SYSTEM,
  USER,
  ALERT,
  INFO,
  REMINDER,
}

export enum ActionTypeEnum {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  PENDING = "PENDING",
  FAILED = "FAILED",
  UNFIXED = "UNFIXED",
  DAILY_WARNING = "DAILY_WARNING",
  REPLY = "REPLY",
}

// Người dùng hệ thống
export enum UserRoleEnum {
  ADMIN,
  MANAGER,
  USER,
}
export enum GenderType {
  MALE,
  FEMALE,
  OTHER,
}

// Thanh toán
export enum PaymentMethodEnum {
  CASH,
  CREDIT_CARD,
  BANK_TRANSFER,
}

// Thuộc tính động
export enum AttributeTypeEnum {
  UNIT,
  CATEGORY,
}

// Trạng thái file
export enum FileStatusEnum {
  PENDING,
  ACTIVE,
  ARCHIVED,
}
export enum FileTypeEnum {
  PICTURE,
  VIDEO,
  FILE,
  IMAGE,
  AUDIO,
  DOCUMENT,
  OTHER,
}
export enum FileCategoryEnum {
  AVATAR,
  RECEIPT,
  ATTACHMENT,
  DOCUMENT,
  LOGO,
  IMAGE,
  VIDEO,
  ALBUM,
  MEDIA,
}

// Giao dịch chung
export enum TransactionTypeEnum {
  INCOME,
  EXPENSE,
  ADVANCE,
  SETTLEMENT,
  REIMBURSE,
}
