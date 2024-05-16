import { createClient, http } from "viem";
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { paymasterActionsEip7677 } from "permissionless/experimental";
import { env } from "./env.js";

export const paymasterClientV06 = createClient({
	transport: http(env.PAYMASTER_SERVICE_URL),
}).extend(paymasterActionsEip7677(ENTRYPOINT_ADDRESS_V06));

export const paymasterClientV07 = createClient({
	transport: http(env.PAYMASTER_SERVICE_URL),
}).extend(paymasterActionsEip7677(ENTRYPOINT_ADDRESS_V07));

export const urlToProvider = (url: string) => {
	if (/pimlico.io/.test(url)) {
		return "pimlico";
	}

	if (/coinbase.com/.test(url)) {
		return "coinbase";
	}

	return "unknown";
};
