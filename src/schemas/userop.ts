import z from "zod/v4";
import {
	partialAuthorizationSchema,
	signedAuthorizationSchema,
} from "./authorization";
import { addressSchema, hexDataSchema, hexNumberSchema } from "./common";
import {
	ENTRYPOINT_V6_ADDRESS,
	ENTRYPOINT_V7_ADDRESS,
	ENTRYPOINT_V8_ADDRESS,
} from "./entrypoints";

const baseUserOperationSchemaV6 = z.object({
	sender: addressSchema,
	nonce: hexNumberSchema,
	initCode: hexDataSchema,
	callData: hexDataSchema,
	callGasLimit: hexNumberSchema,
	verificationGasLimit: hexNumberSchema,
	preVerificationGas: hexNumberSchema,
	maxPriorityFeePerGas: hexNumberSchema,
	maxFeePerGas: hexNumberSchema,
	paymasterAndData: hexDataSchema,
	signature: hexDataSchema,
	eip7702Auth: signedAuthorizationSchema.optional().nullable(),
});

const baseUserOperationSchemaV7 = z.object({
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
	signature: hexDataSchema,
	eip7702Auth: signedAuthorizationSchema.optional().nullable(),
});

// Base user operation schema for V8 (extends V7 with factory allowing "0x7702")
const baseUserOperationSchemaV8 = baseUserOperationSchemaV7.extend({
	factory: z
		.union([addressSchema, z.literal("0x7702")])
		.nullable()
		.optional()
		.transform((val) => val ?? null),
});

const eip7677UserOperationSchemaV6 = baseUserOperationSchemaV6
	.extend({
		paymasterAndData: hexDataSchema
			.nullable()
			.optional()
			.transform((val) => val ?? "0x"),
		signature: hexDataSchema
			.nullable()
			.optional()
			.transform((val) => val ?? "0x"),
	})
	.strict()
	.transform((val) => val);

const eip7677UserOperationSchemaV7 = baseUserOperationSchemaV7
	.extend({
		signature: hexDataSchema.optional().transform((val) => val ?? "0x"),
		eip7702Auth: partialAuthorizationSchema.optional().nullable(),
	})
	.strict()
	.transform((val) => val);

const eip7677UserOperationSchemaV8 = baseUserOperationSchemaV8
	.extend({
		signature: hexDataSchema.optional().transform((val) => val ?? "0x"),
		eip7702Auth: partialAuthorizationSchema.optional().nullable(),
	})
	.strict()
	.transform((val) => val);

const entryPointAwareEip7677UserOperationSchema = z.discriminatedUnion(
	"entryPoint",
	[
		z.object({
			entryPoint: z.literal(ENTRYPOINT_V6_ADDRESS),
			userOp: eip7677UserOperationSchemaV6,
		}),
		z.object({
			entryPoint: z.literal(ENTRYPOINT_V7_ADDRESS),
			userOp: eip7677UserOperationSchemaV7,
		}),
		z.object({
			entryPoint: z.literal(ENTRYPOINT_V8_ADDRESS),
			userOp: eip7677UserOperationSchemaV8,
		}),
	],
);

export { entryPointAwareEip7677UserOperationSchema };
