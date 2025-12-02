import { type Hex, pad } from "viem";
import z from "zod/v4";
import { addressSchema, hexDataSchema, hexNumberSchema } from "./common";

const partialAuthorizationSchema = z.union([
	z.object({
		contractAddress: addressSchema,
		chainId: hexNumberSchema
			.optional()
			.transform((val) => (val ? Number(val) : 1)),
		nonce: hexNumberSchema
			.optional()
			.transform((val) => (val ? Number(val) : 0)),
		r: hexDataSchema
			.optional()
			.transform((val) => (val as Hex) ?? pad("0x", { size: 32 })),
		s: hexDataSchema
			.optional()
			.transform((val) => (val as Hex) ?? pad("0x", { size: 32 })),
		v: hexNumberSchema.optional(),
		yParity: hexNumberSchema
			.optional()
			.transform((val) => (val ? Number(val) : 0)),
	}),
	z.object({
		address: addressSchema,
		chainId: hexNumberSchema
			.optional()
			.transform((val) => (val ? Number(val) : 1)),
		nonce: hexNumberSchema
			.optional()
			.transform((val) => (val ? Number(val) : 0)),
		r: hexDataSchema
			.optional()
			.transform((val) => (val as Hex) ?? pad("0x", { size: 32 })),
		s: hexDataSchema
			.optional()
			.transform((val) => (val as Hex) ?? pad("0x", { size: 32 })),
		v: hexNumberSchema.optional(),
		yParity: hexNumberSchema
			.optional()
			.transform((val) => (val ? Number(val) : 0)),
	}),
]);

const signedAuthorizationSchema = z.union([
	z.object({
		contractAddress: addressSchema,
		chainId: hexNumberSchema.transform(Number),
		nonce: hexNumberSchema.transform(Number),
		r: hexDataSchema.transform((val) => val as Hex),
		s: hexDataSchema.transform((val) => val as Hex),
		v: hexNumberSchema.optional(),
		yParity: hexNumberSchema.transform(Number),
	}),
	z.object({
		address: addressSchema,
		chainId: hexNumberSchema.transform(Number),
		nonce: hexNumberSchema.transform(Number),
		r: hexDataSchema.transform((val) => val as Hex),
		s: hexDataSchema.transform((val) => val as Hex),
		v: hexNumberSchema.optional(),
		yParity: hexNumberSchema.transform(Number),
	}),
]);

export { partialAuthorizationSchema, signedAuthorizationSchema };
