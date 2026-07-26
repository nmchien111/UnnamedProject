import z from "zod";

export const AddressSchema = z.object({
  state: z.string().optional(),
  ward: z.string().optional(),
  detail: z.string().nullish(),
});

export type Address = z.infer<typeof AddressSchema>;
