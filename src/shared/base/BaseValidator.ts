import { z } from "zod";

export const DateTransform = z.coerce.date();

export const zEnumFromTsEnum = <T extends Record<string, string | number>>(
  enumObj: T,
) => z.enum(Object.values(enumObj) as [string, ...string[]]);

export const BaseCreateSchema = z.object({
  tempId: z.uuid().nullish(),
  createdBy: z.uuid().nullish(),
  note: z.string().nullish(),
  isDefault: z.boolean().optional(),
  creatorId: z.uuid().nullish(),
});

export const BaseUpdateSchema = z.object({
  updatedBy: z.uuid().nullish(),
  note: z.string().nullish(),
  updaterId: z.uuid().nullish(),
});

export const BaseQuerySchema = z.object({
  page: z.coerce.number().optional(),
  size: z.coerce.number().optional(),
  keyword: z.string().optional(),
  startAt: DateTransform.optional(),
  endAt: DateTransform.optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["ASC", "DESC"]).optional(),
  isFinished: z.boolean().optional(),
  warehouseId: z.uuid().optional(),
  // Common array ID filters
  storeId: z.uuid().optional(),
  productIds: z
    .union([z.uuid(), z.array(z.uuid())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),

  userIds: z
    .union([z.uuid(), z.array(z.uuid())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),

  warehouseIds: z
    .union([z.uuid(), z.array(z.uuid())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),
  employeeIds: z
    .union([z.uuid(), z.array(z.uuid())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),
  partnerIds: z
    .union([z.uuid(), z.array(z.uuid())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),

  coatingIds: z
    .union([z.uuid(), z.array(z.uuid())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),

  serviceIds: z
    .union([z.uuid(), z.array(z.uuid())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),

  orderIds: z
    .union([z.uuid(), z.array(z.uuid())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),

  productionIds: z
    .union([z.uuid(), z.array(z.uuid())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),

  customerGroupIds: z
    .union([z.uuid(), z.array(z.uuid())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),

  customerIds: z
    .union([z.uuid(), z.array(z.uuid())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),

  unitIds: z
    .union([z.uuid(), z.array(z.uuid())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),

  skuIds: z
    .union([z.uuid(), z.array(z.uuid())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),

  materialIds: z
    .union([z.uuid(), z.array(z.uuid())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      return Array.isArray(val) ? val : [val];
    }),

  totalQuantityGte: z.coerce.number().min(0).optional(),
  totalQuantityLte: z.coerce.number().min(0).optional(),
  totalQuantityGt: z.coerce.number().min(0).optional(),
  totalQuantityLt: z.coerce.number().min(0).optional(),
  totalQuantityEq: z.coerce.number().min(0).optional(),

  totalAmountGte: z.coerce.number().min(0).optional(),
  totalAmountLte: z.coerce.number().min(0).optional(),
  totalAmountGt: z.coerce.number().min(0).optional(),
  totalAmountLt: z.coerce.number().min(0).optional(),
  totalAmountEq: z.coerce.number().min(0).optional(),

  totalAdjustmentQtyGte: z.coerce.number().min(0).optional(),
  totalAdjustmentQtyLte: z.coerce.number().min(0).optional(),
  totalAdjustmentQtyGt: z.coerce.number().min(0).optional(),
  totalAdjustmentQtyLt: z.coerce.number().min(0).optional(),
  totalAdjustmentQtyEq: z.coerce.number().min(0).optional(),

  totalAdjustmentAmountGte: z.coerce.number().min(0).optional(),
  totalAdjustmentAmountLte: z.coerce.number().min(0).optional(),
  totalAdjustmentAmountGt: z.coerce.number().min(0).optional(),
  totalAdjustmentAmountLt: z.coerce.number().min(0).optional(),
  totalAdjustmentAmountEq: z.coerce.number().min(0).optional(),

  totalTransferQtyGte: z.coerce.number().min(0).optional(),
  totalTransferQtyLte: z.coerce.number().min(0).optional(),
  totalTransferQtyGt: z.coerce.number().min(0).optional(),
  totalTransferQtyLt: z.coerce.number().min(0).optional(),
  totalTransferQtyEq: z.coerce.number().min(0).optional(),

  totalTransferAmountGte: z.coerce.number().min(0).optional(),
  totalTransferAmountLte: z.coerce.number().min(0).optional(),
  totalTransferAmountGt: z.coerce.number().min(0).optional(),
  totalTransferAmountLt: z.coerce.number().min(0).optional(),
  totalTransferAmountEq: z.coerce.number().min(0).optional(),

  priceGte: z.coerce.number().min(0).optional(),
  priceLte: z.coerce.number().min(0).optional(),
  priceGt: z.coerce.number().min(0).optional(),
  priceLt: z.coerce.number().min(0).optional(),
  priceEq: z.coerce.number().min(0).optional(),

  taxRateGte: z.coerce.number().min(0).optional(),
  taxRateLte: z.coerce.number().min(0).optional(),
  taxRateGt: z.coerce.number().min(0).optional(),
  taxRateLt: z.coerce.number().min(0).optional(),
  taxRateEq: z.coerce.number().min(0).optional(),

  stockQtyGte: z.coerce.number().min(0).optional(),
  stockQtyLte: z.coerce.number().min(0).optional(),
  stockQtyGt: z.coerce.number().min(0).optional(),
  stockQtyLt: z.coerce.number().min(0).optional(),
  stockQtyEq: z.coerce.number().min(0).optional(),

  quantityGte: z.coerce.number().min(0).optional(),
  quantityLte: z.coerce.number().min(0).optional(),
  quantityGt: z.coerce.number().min(0).optional(),
  quantityLt: z.coerce.number().min(0).optional(),
  quantityEq: z.coerce.number().min(0).optional(),
});

export const BaseParamsSchema = z.object({
  id: z.uuid(),
});

export const AddressSchema = z.object({
  state: z.string().optional(),
  ward: z.string().optional(),
  detail: z.string().nullish(),
});

export const SettingSchema = z.object({
  region: z
    .object({
      country: z.string().nullish(),
      language: z.string().nullish(),
      timezone: z.string().nullish(),
    })
    .optional(),
  dateFormat: z
    .object({
      date: z.string().nullish(),
      time: z.string().nullish(),
      displayTime: z.string().nullish(),
    })
    .optional(),
  numberFormat: z
    .object({
      decimal: z.string().nullish(),
      thousand: z.string().nullish(),
      fraction: z.string().nullish(),
    })
    .optional(),
  currencyFormat: z
    .object({
      symbol: z.string().nullish(),
      fraction: z.string().nullish(),
      position: z.enum(["before", "after"]).optional(),
    })
    .optional(),
});

export type ISetting = z.infer<typeof SettingSchema>;

export const BankAccountSchema = z.object({
  bankName: z.string(),
  accountNumber: z.string(),
  accountHolder: z.string(),
  branch: z.string().nullish(),
});

export const CitizenIdentificationSchema = z.object({
  id: z.string(),
  name: z.string(),
  dob: z.date().nullish(),
  gender: z.string().nullish(),
  issuedDate: z.date().nullish(),
  expirationDate: z.date().nullish(),
  placeOfIssue: z.string().nullish(),
  issuedBy: z.string().nullish(),
  files: z.array(z.string()).optional().default([]),
});

export const RepresentativeSchema = z.object({
  name: z.string().nullish(),
  position: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
});

export type Address = z.infer<typeof AddressSchema>;
export type IBankAccount = z.infer<typeof BankAccountSchema>;
export type ICitizenIdentification = z.infer<
  typeof CitizenIdentificationSchema
>;
export type BaseQueryDto = z.infer<typeof BaseQuerySchema>;
export type BaseParamsDto = z.infer<typeof BaseParamsSchema>;
export type IRepresentative = z.infer<typeof RepresentativeSchema>;
