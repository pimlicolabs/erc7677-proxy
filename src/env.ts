import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		PAYMASTER_SERVICE_URL: z.string().url(),
		ENTRYPOINT_V06_ENABLED: z.boolean().default(true),
		ENTRYPOINT_V07_ENABLED: z.boolean().default(true),
		CHAIN_ID_WHITELIST: z
			.string()
			.transform((val) => val.split(",").map((v) => Number(v)))
			.optional(),
		EXTRA_CONTEXT: z.string().optional(),
		PIMLICO_SPONSORSHIP_POLICY_IDS: z
			.string()
			.transform((val) => val.split(","))
			.optional(),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
