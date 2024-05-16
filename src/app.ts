import { Hono } from "hono";
import { validator } from "hono/validator";
import { logger } from "hono/logger";
import {
	paymasterClientV06,
	paymasterClientV07,
	urlToProvider,
} from "./config.js";
import { erc7677RequestSchema, jsonRpcSchema } from "./schemas.js";
import {
	ENTRYPOINT_ADDRESS_V06,
	ENTRYPOINT_ADDRESS_V07,
	type UserOperation,
} from "permissionless";
import { fromZodError } from "zod-validation-error";
import type { Chain } from "viem";
import { env } from "./env.js";
import { getPimlicoContext } from "./providers.js";
const provider = urlToProvider(env.PAYMASTER_SERVICE_URL);

const app = new Hono();
app.use(logger());

app.get("/", (c) => {
	return c.html(
		`<html>
            <head>
                <meta name="color-scheme" content="light dark">
            </head>
            <body>
                <pre style="word-wrap: break-word; white-space: pre-wrap;">
Hello World!

This is an ERC-7677 Paymaster Service Proxy.

Visit <a href="https://github.com/pimlicolabs/erc7677-proxy">the GitHub repository</a> for more information on configuring your proxy.
                </pre>
            </body>
        </html>`,
	);
});

app.get("/health", (c) => {
	return c.text("OK");
})

app.post(
	"/api/paymaster",
	validator("json", (value, c) => {
		const jsonRpcParsed = jsonRpcSchema.safeParse(value);
		if (!jsonRpcParsed.success) {
			return c.text("Invalid JSON-RPC Request", 404);
		}

		const erc7677Parsed = erc7677RequestSchema.safeParse(jsonRpcParsed.data);
		if (!erc7677Parsed.success) {
			return c.json(fromZodError(erc7677Parsed.error), 404);
		}

		return erc7677Parsed.data;
	}),
	async (c) => {
		const request = c.req.valid("json");
		const method = request.method;
		const [userOperation, entrypoint, chainId, extraParam] = request.params;

		if (
			env.CHAIN_ID_WHITELIST &&
			!env.CHAIN_ID_WHITELIST.includes(Number(chainId))
		) {
			return c.text(
				`Unsupported chain. Supported chains are ${env.CHAIN_ID_WHITELIST.join(
					", ",
				)}`,
				404,
			);
		}

		console.log(`<-- method ${method} chainId ${chainId} entryPoint ${entrypoint} extraParam ${extraParam}`)

		if (entrypoint === ENTRYPOINT_ADDRESS_V06 && env.ENTRYPOINT_V06_ENABLED) {
			if (method === "pm_getPaymasterStubData") {
				let providerContext: Record<string, any> | null = null;

				if (provider === "pimlico") {
					providerContext = await getPimlicoContext(
						userOperation as UserOperation<"v0.6">,
						entrypoint,
						extraParam,
					);
				}

				const result = await paymasterClientV06.getPaymasterStubData({
					userOperation: userOperation as UserOperation<"v0.6">,
					chain: { id: Number(chainId) } as Chain,
					context: { ...extraParam, ...providerContext },
				});

				console.log(`--> result ${JSON.stringify(result)}`)
				return c.json({ result, id: request.id, jsonrpc: request.jsonrpc });
			}

			if (method === "pm_getPaymasterData") {
				let providerContext: Record<string, any> | null = null;

				if (provider === "pimlico") {
					providerContext = await getPimlicoContext(
						userOperation as UserOperation<"v0.6">,
						entrypoint,
						extraParam,
					);
				}

				const result = await paymasterClientV06.getPaymasterData({
					userOperation: userOperation as UserOperation<"v0.6">,
					chain: { id: Number(chainId) } as Chain,
					context: { ...extraParam, ...providerContext },
				});

				console.log(`--> result ${JSON.stringify(result)}`)
				return c.json({ result, id: request.id, jsonrpc: request.jsonrpc });
			}
		}

		if (entrypoint === ENTRYPOINT_ADDRESS_V07 && env.ENTRYPOINT_V07_ENABLED) {
			if (method === "pm_getPaymasterStubData") {
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				let providerContext: Record<string, any> | null = null;

				if (provider === "pimlico") {
					providerContext = await getPimlicoContext(
						userOperation as UserOperation<"v0.7">,
						entrypoint,
						extraParam,
					);
				}

				const result = await paymasterClientV07.getPaymasterStubData({
					userOperation: userOperation as UserOperation<"v0.7">,
					chain: { id: Number(chainId) } as Chain,
					context: { ...extraParam, ...providerContext },
				});

				console.log(`--> result ${JSON.stringify(result)}`)
				return c.json({ result, id: request.id, jsonrpc: request.jsonrpc });
			}

			if (method === "pm_getPaymasterData") {
				let providerContext: Record<string, any> | null = null;

				if (provider === "pimlico") {
					providerContext = await getPimlicoContext(
						userOperation as UserOperation<"v0.7">,
						entrypoint,
						extraParam,
					);
				}
			
				const result = await paymasterClientV07.getPaymasterData({
					userOperation: userOperation as UserOperation<"v0.7"> & {
						paymasterVerificationGasLimit: bigint;
						paymasterPostOpGasLimit: bigint;
					},
					chain: { id: Number(chainId) } as Chain,
					context: { ...extraParam, ...providerContext },
				});

				console.log(`--> result ${JSON.stringify(result)}`)
				return c.json({ result, id: request.id, jsonrpc: request.jsonrpc });
			}
		}

		return c.text("EntryPoint not supported", 404);
	},
);

export default app;
