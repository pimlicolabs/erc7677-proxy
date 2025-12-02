# ERC-7677 Proxy Template

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/pfCJqF?referralCode=itQ_Ia)

## Overview

This repository contains an ERC-7677 proxy template built with Hono that can be spun up by dapps wishing to sponsor user operations originating from smart account users

- Supports Multiple EntryPoints (0.6, 0.7, and 0.8)
- Supporting Multiple Chains at once
- Configure Pimlico sponsorship policies

## Deploy

### 1. Get a Pimlico API key

Go to the [Pimlico dashboard](https://dashboard.pimlico.io) and create an API key

### Deploy using a template

Use one of the templates below to deploy an instance of the proxy server, pasting in the previously created Pimlico API key.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/pfCJqF?referralCode=itQ_Ia)

### Create a public URL

On the serverless provider of your choice, create a public URL that will point to your paymaster proxy instance. Use this URL as the `paymasterService` in your dapp.

## Development

### 1. Copy the .env template and edit it, filling in with your paymaster service provider, chain id whitelist, and more.

```bash
cp .env.template .env
```

### 2. Install and run the Hono server

```bash
npm install
npm run dev
```

### 3. (Recommended) Add custom authentication to protect your endpoint.

Consider using Hono helpers such as [Bearer Auth](https://hono.dev/middleware/builtin/bearer-auth), [CORS](https://hono.dev/middleware/builtin/cors), [JWT](https://hono.dev/helpers/jwt), [Clerk Auth](https://github.com/honojs/middleware/tree/main/packages/clerk-auth), [Next Auth](https://github.com/honojs/middleware/tree/main/packages/auth-js), or any other custom middleware for this. Add this logic to the `src/index.ts` file.

Your endpoint will now be available at `http://localhost:3000/api/paymaster`

### Deploy to a provider

It is recommended to deploy the endpoint to a hosting provider like Vercel and assign it a custom domain.

## Example Usage

Example ERC7677 sponsorship flow using this proxy template running locally:

```typescript
import { createSmartAccountClient } from "permissionless";
import { http, zeroAddress, createPublicClient } from "viem";
import {
	createPaymasterClient,
	entryPoint08Address,
} from "viem/account-abstraction";
import { toSimpleSmartAccount } from "permissionless/accounts";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { baseSepolia } from "viem/chains";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

// ======== Setting up consts ========
const chain = baseSepolia;
const erc7677ProxyUrl = `http://localhost:3000/api/paymaster`;
const pimlicoUrl = `https://api.pimlico.io/v2/${chain.id}/rpc?apikey=${process.env.PIMLICO_API_KEY}`;

// ======== Setting up clients ========
const publicClient = createPublicClient({
	chain,
	transport: http(),
});

const pimlicoClient = createPimlicoClient({
	transport: http(pimlicoUrl),
});

const paymasterClient = createPaymasterClient({
	transport: http(erc7677ProxyUrl),
});

const account = await toSimpleSmartAccount({
	client: publicClient,
	owner: privateKeyToAccount(generatePrivateKey()), // Random private key
	entryPoint: {
		address: entryPoint08Address,
		version: "0.8",
	},
});

const smartAccountClient = createSmartAccountClient({
	client: publicClient,
	chain,
	account: account,
	paymaster: paymasterClient,
	bundlerTransport: http(pimlicoUrl),
	userOperation: {
		estimateFeesPerGas: async () => {
			const gasPrices = await pimlicoClient.getUserOperationGasPrice();
			return gasPrices.fast;
		},
	},
});

// ======== Sending UserOperation ========
const userOpHash = await smartAccountClient.sendUserOperation({
	calls: [
		{
			to: zeroAddress,
			value: 0n,
			data: "0x",
		},
	],
});

const receipt = await smartAccountClient.waitForUserOperationReceipt({
	hash: userOpHash,
});

console.log(`UserOp included in tx: ${receipt.receipt?.transactionHash}`);
```
