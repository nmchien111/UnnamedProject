import { FindOptionsSelect } from "typeorm";
import { BaseEntity } from "./BaseEntity";

export const BaseSelect: FindOptionsSelect<BaseEntity> = {
  id: true,
  creatorId: true,
  creatorSnapshot: true,
  updaterId: true,
  updaterSnapshot: true,
  createdAt: true,
  updatedAt: true,
  note: true,
  isDefault: true,
};
