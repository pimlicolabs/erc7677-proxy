import z from "zod/v4";

const paymasterContextSchema = z
	.union([
		z.object({ sponsorshipPolicyId: z.string() }),
		z.object({ sponsorshipPolicyIds: z.array(z.string()) }),
	])
	.nullable();

export type PaymasterContext = z.infer<typeof paymasterContextSchema>;
export { paymasterContextSchema };
