import { Entity, Column, Index } from "typeorm";
import { BaseEntity } from "../../shared/base/BaseEntity";

@Entity("tokens")
export class Token extends BaseEntity {
  @Column({ type: "text", unique: true })
  @Index()
  refreshToken: string; // Mã refresh token được cấp phát[cite: 2]

  @Column({ type: "timestamptz" })
  expiresAt: Date; // Thời điểm token hết hạn

  @Column({ type: "boolean", default: false })
  isRevoked: boolean; // Cờ đánh dấu token đã bị thu hồi (đăng xuất hoặc đổi mật khẩu)

  @Column({ type: "uuid" })
  @Index()
  targetId: string; // ID của User hoặc Driver sở hữu token này
}
