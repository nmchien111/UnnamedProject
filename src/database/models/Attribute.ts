import { BaseEntity } from "@/shared/base/BaseEntity";
import { AttributeTypeEnum } from "@/shared/constants/enum";
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";

@Entity("attributes")
export class Attribute extends BaseEntity {
  @Column({ type: "varchar" })
  name: string;

  @Index()
  @Column({ type: "varchar", length: 25 })
  type: AttributeTypeEnum;

  @Column({ type: "uuid", nullable: true, default: null })
  parentId: string | null;

  @ManyToOne(() => Attribute, (attribute) => attribute.children, {
    nullable: true,
    onDelete: "CASCADE", // Nếu xóa cha thì xóa luôn các con
  })
  @JoinColumn({ name: "parentId" })
  parent: Attribute | null;

  @OneToMany(() => Attribute, (attribute) => attribute.parent)
  children: Attribute[];
}
