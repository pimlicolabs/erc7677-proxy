import { Hono } from "hono";
import { validator } from "hono/validator";
import { logger } from "hono/logger";
import {
	entryPoint06Address,
	entryPoint07Address,
	entryPoint08Address,
	type UserOperation,
} from "viem/account-abstraction";
import { fromZodError } from "zod-validation-error";
import { http, type Chain } from "viem";
import { env } from "./env.js";
import { getPimlicoContext } from "./providers.js";
import { getPimlicoUrl } from "./config.js";
import { createPaymasterClient } from "viem/account-abstraction";
import { jsonRpcSchema } from "./schemas/rpc.js";
import { erc7677RequestSchema } from "./schemas/methods.js";

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

		console.log(
			`<-- method ${method} chainId ${chainId} entryPoint ${entrypoint} extraParam ${extraParam}`,
		);

		if (entrypoint === entryPoint06Address && env.ENTRYPOINT_06_ENABLED) {
			const paymasterClient06 = createPaymasterClient({
				transport: http(getPimlicoUrl(chainId)),
			});

			if (method === "pm_getPaymasterStubData") {
				const providerContextResult = await getPimlicoContext(
					userOperation,
					entrypoint,
					chainId,
					extraParam,
				);

				if (providerContextResult.result === "reject") {
					return c.text("Rejected", 403);
				}

				const result = await paymasterClient06.getPaymasterStubData({
					...userOperation,
					chain: { id: Number(chainId) } as Chain,
					context: { ...providerContextResult.extraParam },
				});

				console.log(`--> result ${JSON.stringify(result)}`);
				return c.json({
					result,
					id: request.id,
					jsonrpc: request.jsonrpc,
				});
			}

			if (method === "pm_getPaymasterData") {
				const providerContextResult = await getPimlicoContext(
					userOperation,
					entrypoint,
					chainId,
					extraParam,
				);

				if (providerContextResult.result === "reject") {
					return c.text("Rejected", 403);
				}

				const result = await paymasterClient06.getPaymasterData({
					...userOperation,
					chain: { id: Number(chainId) } as Chain,
					context: { ...providerContextResult.extraParam },
				});

				console.log(`--> result ${JSON.stringify(result)}`);
				return c.json({ result, id: request.id, jsonrpc: request.jsonrpc });
			}
		}

		if (entrypoint === entryPoint07Address && env.ENTRYPOINT_07_ENABLED) {
			const paymasterClient07 = createPaymasterClient({
				transport: http(getPimlicoUrl(chainId)),
			});

			if (method === "pm_getPaymasterStubData") {
				const providerContextResult = await getPimlicoContext(
					userOperation,
					entrypoint,
					chainId,
					extraParam,
				);

				if (providerContextResult.result === "reject") {
					return c.text("Rejected", 403);
				}

				const result = await paymasterClient07.getPaymasterStubData({
					...userOperation,
					chainId: Number(chainId),
					context: { ...providerContextResult.extraParam },
				});

				console.log(`--> result ${JSON.stringify(result)}`);
				return c.json({ result, id: request.id, jsonrpc: request.jsonrpc });
			}

			if (method === "pm_getPaymasterData") {
				const providerContextResult = await getPimlicoContext(
					userOperation,
					entrypoint,
					chainId,
					extraParam,
				);

				if (providerContextResult.result === "reject") {
					return c.text("Rejected", 403);
				}

				const result = await paymasterClient07.getPaymasterData({
					...userOperation,
					chain: { id: Number(chainId) } as Chain,
					context: { ...providerContextResult.extraParam },
				});

				console.log(`--> result ${JSON.stringify(result)}`);
				return c.json({ result, id: request.id, jsonrpc: request.jsonrpc });
			}
		}

		return c.text("EntryPoint not supported", 404);
	},
);

export default app;
