import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { config } from "dotenv";
config();

export const env = createEnv({
	server: {
		PORT: z
			.string()
			.transform((val) => Number(val))
			.default("3000").describe("The port the server will listen on"),
		PAYMASTER_SERVICE_URL: z.string().url().describe("The URL of the paymaster service"),
		ENTRYPOINT_V06_ENABLED: z.boolean().default(true).describe("Whether the v0.6 entrypoint is enabled"),
		ENTRYPOINT_V07_ENABLED: z.boolean().default(true).describe("Whether the v0.7 entrypoint is enabled"),
		CHAIN_ID_WHITELIST: z
			.string()
			.transform((val) => val.split(",").map((v) => Number(v)))
			.optional().describe("The chain IDs that are supported (defaults to all chains)"),
		PIMLICO_SPONSORSHIP_POLICY_IDS: z
			.string()
			.transform((val) => val.split(","))
			.optional().describe("If using Pimlico paymasters, then a comma separated list of Pimlico sponsorship policy IDs to check against on each request"),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
