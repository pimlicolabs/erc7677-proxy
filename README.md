# ERC-7677 Proxy Template

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/pfCJqF?referralCode=itQ_Ia)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fpimlicolabs%2Ferc7677-proxy)

## Overview

This repository contains an ERC-7677 proxy template built with Hono that can be spun up by dapps wishing to sponsor user operations originating from smart account users

- Supports Multiple EntryPoints (v0.6 and v0.7)
- Supporting Multiple Chains at once
- (optionally) configure Pimlico sponsorship policies

## Install

### Copy the .env template and edit it, filling in with your paymaster service provider, chain id whitelist, and more. 

```bash
cp .env.template .env
```

### Install and run the Hono server

```bash
npm install
npm run dev
```

### (Recommended) Add custom authentication to protect your endpoint.

Consider using Hono helpers such as [Bearer Auth](https://hono.dev/middleware/builtin/bearer-auth), [CORS](https://hono.dev/middleware/builtin/cors), [JWT](https://hono.dev/helpers/jwt), [Clerk Auth](https://github.com/honojs/middleware/tree/main/packages/clerk-auth), [Next Auth](https://github.com/honojs/middleware/tree/main/packages/auth-js), or any other custom middleware for this. Add this logic to the `src/index.ts` file.

Your endpoint will now be available at `http://localhost:3000/api/paymaster`

### Deploy to a provider

It is recommended to deploy the endpoint to a hosting provider like Vercel and assign it a custom domain.