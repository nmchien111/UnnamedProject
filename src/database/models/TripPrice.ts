import { Trip } from "./Trip";
import { BaseEntity } from "../../shared/base/BaseEntity";
import { Column, Entity, ManyToOne, JoinColumn } from "typeorm";

@Entity("trip_prices")
export class TripPrice extends BaseEntity {
  @Column({ type: "numeric" })
  price: number; // Giá cước chuyến đi

  @Column({ type: "uuid", nullable: false })
  tripId: string;

  @Column({ type: "timestamptz" })
  timeAt: Date;

  @ManyToOne(() => Trip, { onDelete: "CASCADE" })
  @JoinColumn({ name: "tripId" })
  trip: Trip;
}
