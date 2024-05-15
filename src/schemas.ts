import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import type {
	ENTRYPOINT_ADDRESS_V06_TYPE,
	ENTRYPOINT_ADDRESS_V07_TYPE,
} from "permissionless/types";
import { type Hash, type Hex, getAddress } from "viem";
import { z } from "zod";

const hexDataPattern = /^0x[0-9A-Fa-f]*$/;
const addressPattern = /^0x[0-9,a-f,A-F]{40}$/;

export const jsonRpcSchema = z
	.object({
		method: z.unknown(),
		params: z.unknown(),
		jsonrpc: z.literal("2.0"),
		id: z.number(),
	})
	.strict();

export const addressSchema = z
	.string()
	.regex(addressPattern, { message: "not a valid hex address" })
	.transform((val) => getAddress(val));
export const hexNumberSchema = z
	.string()
	.regex(hexDataPattern)
	.or(z.number())
	.or(z.bigint())
	.superRefine((data, ctx) => {
		// This function is used to refine the input and provide a context where you have access to the path.
		try {
			BigInt(data); // Attempt to convert to BigInt to validate it can be done
		} catch {
			ctx.addIssue({
				code: "custom",
				message:
					"Invalid input, expected a value that can be converted to bigint.",
				path: ctx.path, // ctx.path will have the path to the invalid data
			});
		}
	})
	.transform((val) => BigInt(val));
export const hexDataSchema = z
	.string()
	.regex(hexDataPattern, { message: "not valid hex data" })
	.max(160000, {
		message: "hex data too long, maximum length is 80000 bytes",
	})
	.transform((val) => val.toLowerCase() as Hex);

const eip7677UserOperationSchemaV6 = z
	.object({
		sender: addressSchema,
		nonce: hexNumberSchema,
		initCode: hexDataSchema,
		callData: hexDataSchema,
		callGasLimit: hexNumberSchema,
		verificationGasLimit: hexNumberSchema,
		preVerificationGas: hexNumberSchema,
		maxPriorityFeePerGas: hexNumberSchema,
		maxFeePerGas: hexNumberSchema,
		paymasterAndData: hexDataSchema
			.nullable()
			.optional()
			.transform((_) => {
				return "0x" as Hex;
			}),
		signature: hexDataSchema
			.nullable()
			.optional()
			.transform((_) => {
				return "0x" as Hex;
			}),
	})
	.strict()
	.transform((val) => {
		return val;
	});

const eip7677UserOperationSchemaV7 = z
	.object({
		sender: addressSchema,
		nonce: hexNumberSchema,
		factory: addressSchema
			.nullable()
			.optional()
			.transform((val) => val ?? null),
		factoryData: hexDataSchema
			.nullable()
			.optional()
			.transform((val) => val ?? null),
		callData: hexDataSchema,
		callGasLimit: hexNumberSchema,
		verificationGasLimit: hexNumberSchema,
		preVerificationGas: hexNumberSchema,
		maxFeePerGas: hexNumberSchema,
		maxPriorityFeePerGas: hexNumberSchema,
		paymaster: addressSchema
			.nullable()
			.optional()
			.transform((val) => val ?? null),
		paymasterVerificationGasLimit: hexNumberSchema
			.nullable()
			.optional()
			.transform((val) => val ?? null),
		paymasterPostOpGasLimit: hexNumberSchema
			.nullable()
			.optional()
			.transform((val) => val ?? null),
		paymasterData: hexDataSchema
			.nullable()
			.optional()
			.transform((val) => val ?? null),
		signature: hexDataSchema.optional().transform((val) => {
			if (val === undefined) {
				return "0x";
			}
			return val;
		}),
	})
	.strict()
	.transform((val) => {
		return val;
	});

const erc7677ParamsSchema = z
	.union([
		z.tuple([
			eip7677UserOperationSchemaV6,
			addressSchema
				.refine((val) => getAddress(val) === ENTRYPOINT_ADDRESS_V06, {
					message: "Invalid EntryPoint",
				})
				.transform((val) => getAddress(val) as ENTRYPOINT_ADDRESS_V06_TYPE),
			hexNumberSchema,
			z.any(),
		]),
		z.tuple([
			eip7677UserOperationSchemaV6,
			addressSchema
				.refine((val) => getAddress(val) === ENTRYPOINT_ADDRESS_V06, {
					message: "Invalid EntryPoint",
				})
				.transform((val) => getAddress(val) as ENTRYPOINT_ADDRESS_V06_TYPE),
			hexNumberSchema,
		]),
		z.tuple([
			eip7677UserOperationSchemaV7,
			addressSchema
				.refine((val) => getAddress(val) === ENTRYPOINT_ADDRESS_V07, {
					message: "Invalid EntryPoint",
				})
				.transform((val) => getAddress(val) as ENTRYPOINT_ADDRESS_V07_TYPE),
			hexNumberSchema,
			z.any(),
		]),
		z.tuple([
			eip7677UserOperationSchemaV7,
			addressSchema
				.refine((val) => getAddress(val) === ENTRYPOINT_ADDRESS_V07, {
					message: "Invalid EntryPoint",
				})
				.transform((val) => getAddress(val) as ENTRYPOINT_ADDRESS_V07_TYPE),
			hexNumberSchema,
		]),
	])
	.transform((val) => {
		return [val[0], val[1], val[2], val[3] ?? null] as const;
	});

export const getPaymasterDataSchema = z.object({
	method: z.literal("pm_getPaymasterData"),
	params: erc7677ParamsSchema,
	jsonrpc: z.literal("2.0"),
	id: z.number(),
});

export const getPaymasterStubDataSchema = z.object({
	method: z.literal("pm_getPaymasterStubData"),
	params: erc7677ParamsSchema,
	jsonrpc: z.literal("2.0"),
	id: z.number(),
});

export const erc7677RequestSchema = z.discriminatedUnion("method", [
	getPaymasterDataSchema,
	getPaymasterStubDataSchema,
]);
