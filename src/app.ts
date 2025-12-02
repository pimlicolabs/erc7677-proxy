import { Hono } from "hono";
import { validator } from "hono/validator";
import { logger } from "hono/logger";
import {
	entryPoint06Address,
	entryPoint07Address,
	createPaymasterClient,
	entryPoint08Address,
	EntryPointVersion,
} from "viem/account-abstraction";
import { fromZodError } from "zod-validation-error";
import { http, toHex, type Address, type Chain } from "viem";
import { env } from "./env.js";
import { getPimlicoContext } from "./providers.js";
import { getPimlicoUrl } from "./config.js";
import { jsonRpcSchema } from "./schemas/rpc.js";
import { erc7677RequestSchema } from "./schemas/methods.js";
import * as chains from "viem/chains";

const entryPoints: Record<
	Address,
	{ version: EntryPointVersion; enabled: boolean }
> = {
	[entryPoint06Address]: { version: "0.6", enabled: env.ENTRYPOINT_06_ENABLED },
	[entryPoint07Address]: { version: "0.7", enabled: env.ENTRYPOINT_07_ENABLED },
	[entryPoint08Address]: { version: "0.8", enabled: env.ENTRYPOINT_08_ENABLED },
};

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
});

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
		const [userOperation, entrypoint, chainId, context] = request.params;

		console.log(
			`<-- method ${method} chainId ${chainId} entryPoint ${entrypoint} context ${JSON.stringify(
				context,
			)}`,
		);

		// Turn chainId into Chain.
		let chain: Chain | undefined;
		for (const c of Object.values(chains)) {
			if (c.id === Number(chainId)) {
				chain = c;
				break;
			}
		}

		// Validate chain.
		if (
			!chain ||
			(env.CHAIN_ID_WHITELIST && !env.CHAIN_ID_WHITELIST.includes(chain.id))
		) {
			const supported =
				env.CHAIN_ID_WHITELIST?.join(", ") ?? Object.keys(chains).join(", ");

			return c.text(
				`Unsupported chain. Supported chains are ${supported}`,
				404,
			);
		}

		// Validate entrypoint.
		const entryPointConfig = entryPoints[entrypoint];
		if (!entryPointConfig?.enabled) {
			return c.text("EntryPoint not supported", 404);
		}

		// Handle request.
		const paymasterClient = createPaymasterClient({
			transport: http(getPimlicoUrl(chain.id)),
		});

		const providerContextResult = await getPimlicoContext({
			userOperation,
			entryPoint: { address: entrypoint, version: entryPointConfig.version },
			chain,
			context,
		});

		if (providerContextResult.result === "reject") {
			return c.text("Rejected", 403);
		}

		const params = {
			...userOperation,
			chainId: chain.id,
			context: { ...providerContextResult.extraParam },
			entryPointAddress: entrypoint,
		};

		const result =
			method === "pm_getPaymasterStubData"
				? await paymasterClient.getPaymasterStubData(params)
				: await paymasterClient.getPaymasterData(params);

		// Convert any bigint fields to hex string before returning.
		let jsonResponse: any = {
			...result,
		};

		if (result.paymasterPostOpGasLimit) {
			jsonResponse.paymasterPostOpGasLimit = toHex(
				result.paymasterPostOpGasLimit,
			);
		}

		if (result.paymasterVerificationGasLimit) {
			jsonResponse.paymasterVerificationGasLimit = toHex(
				result.paymasterVerificationGasLimit,
			);
		}

		console.log("--> result", result);
		return c.json({
			result: jsonResponse,
			id: request.id,
			jsonrpc: request.jsonrpc,
		});
	},
);

export default app;
