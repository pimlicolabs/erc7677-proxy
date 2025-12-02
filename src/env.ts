import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { config } from "dotenv";
config();

const serverSchema = {
	PORT: z
		.string()
		.transform((val) => Number(val))
		.default("3000")
		.describe("The port the server will listen on"),
	PIMLICO_API_KEY: z.string().describe("Your Pimlico API key"),
	PIMLICO_SPONSORSHIP_POLICY_IDS: z
		.string()
		.transform((val) => val.split(","))
		.optional()
		.describe(
			"Comma separated list of Pimlico sponsorship policy IDs to check against on each request",
		),
	ENTRYPOINT_06_ENABLED: z
		.boolean()
		.default(true)
		.describe("Whether entrypoint 0.6 is enabled"),
	ENTRYPOINT_07_ENABLED: z
		.boolean()
		.default(true)
		.describe("Whether entrypoint 0.7 is enabled"),
	CHAIN_ID_WHITELIST: z
		.string()
		.transform((val) => val.split(",").map((v) => Number(v)))
		.optional()
		.describe("The chain IDs that are supported (defaults to all chains)"),
};

export const env = createEnv({
	server: serverSchema,
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
