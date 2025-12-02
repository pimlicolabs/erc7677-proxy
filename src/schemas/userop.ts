import z from "zod/v4";
import {
	partialAuthorizationSchema,
	signedAuthorizationSchema,
} from "./authorization";
import { addressSchema, hexDataSchema, hexNumberSchema } from "./common";
import {
	ENTRYPOINT_06_ADDRESS,
	ENTRYPOINT_07_ADDRESS,
	ENTRYPOINT_08_ADDRESS,
} from "./entrypoints";

const baseUserOperationSchema06 = z.object({
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

const baseUserOperationSchema07 = z.object({
	sender: addressSchema,
	nonce: hexNumberSchema,
	factory: addressSchema
		.nullable()
		.optional()
		.transform((val) => val ?? undefined),
	factoryData: hexDataSchema
		.nullable()
		.optional()
		.transform((val) => val ?? undefined),
	callData: hexDataSchema,
	callGasLimit: hexNumberSchema,
	verificationGasLimit: hexNumberSchema,
	preVerificationGas: hexNumberSchema,
	maxFeePerGas: hexNumberSchema,
	maxPriorityFeePerGas: hexNumberSchema,
	paymaster: addressSchema
		.nullable()
		.optional()
		.transform((val) => val ?? undefined),
	paymasterVerificationGasLimit: hexNumberSchema
		.nullable()
		.optional()
		.transform((val) => val ?? undefined),
	paymasterPostOpGasLimit: hexNumberSchema
		.nullable()
		.optional()
		.transform((val) => val ?? undefined),
	paymasterData: hexDataSchema
		.nullable()
		.optional()
		.transform((val) => val ?? undefined),
	signature: hexDataSchema,
	eip7702Auth: signedAuthorizationSchema.optional().nullable(),
});

// Base user operation schema for V8 (extends V7 with factory allowing "0x7702")
const baseUserOperationSchema08 = baseUserOperationSchema07.extend({
	factory: z
		.union([addressSchema, z.literal("0x7702")])
		.nullable()
		.optional()
		.transform((val) => val ?? undefined),
});

const eip7677UserOperationSchema06 = baseUserOperationSchema06
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

const eip7677UserOperationSchema07 = baseUserOperationSchema07
	.extend({
		signature: hexDataSchema.optional().transform((val) => val ?? "0x"),
		eip7702Auth: partialAuthorizationSchema.optional().nullable(),
	})
	.strict()
	.transform((val) => val);

const eip7677UserOperationSchema08 = baseUserOperationSchema08
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
			entryPoint: z.literal(ENTRYPOINT_06_ADDRESS),
			userOp: eip7677UserOperationSchema06,
		}),
		z.object({
			entryPoint: z.literal(ENTRYPOINT_07_ADDRESS),
			userOp: eip7677UserOperationSchema07,
		}),
		z.object({
			entryPoint: z.literal(ENTRYPOINT_08_ADDRESS),
			userOp: eip7677UserOperationSchema08,
		}),
	],
);

export { entryPointAwareEip7677UserOperationSchema };
