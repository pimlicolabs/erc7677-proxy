import z from "zod/v4";
import { addressSchema, hexNumberSchema } from "./common";
import { paymasterContextSchema } from "./paymaster-context";
import { entryPointAwareEip7677UserOperationSchema } from "./userOp";

const pmGetPaymasterDataParamsSchema = z
	.tuple([
		z.looseObject({}),
		addressSchema,
		hexNumberSchema,
		paymasterContextSchema.nullish(),
	])
	.transform((params) => {
		const [userOp, entryPoint, chainId, context] = params;

		return [{ userOp, entryPoint }, chainId, context];
	})
	.pipe(
		z.tuple([
			entryPointAwareEip7677UserOperationSchema,
			z.bigint(),
			paymasterContextSchema.nullish().default(null),
		]),
	)
	.transform((validated) => {
		const [discriminated, chainId, context] = validated;

		return [
			discriminated.userOp,
			discriminated.entryPoint,
			chainId,
			context,
		] as const;
	});

const pmGetPaymasterStubDataRequestSchema = z.object({
	method: z.literal("pm_getPaymasterStubData"),
	params: pmGetPaymasterDataParamsSchema,
	jsonrpc: z.literal("2.0"),
	id: z.number(),
});

const pmGetPaymasterDataRequestSchema = z.object({
	method: z.literal("pm_getPaymasterData"),
	params: pmGetPaymasterDataParamsSchema,
	jsonrpc: z.literal("2.0"),
	id: z.number(),
});

export const erc7677RequestSchema = z.union([
	pmGetPaymasterStubDataRequestSchema,
	pmGetPaymasterDataRequestSchema,
]);
