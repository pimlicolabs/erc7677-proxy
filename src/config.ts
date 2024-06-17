import { createClient, http } from "viem";
import { ENTRYPOINT_ADDRESS_V06, ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { paymasterActionsEip7677 } from "permissionless/experimental";
import { env } from "./env.js";

export const getPimlicoUrl = (chainId: bigint) => {
	return `https://api.pimlico.io/v2/${chainId.toString()}/rpc?apikey=${
		env.PIMLICO_API_KEY
	}`;
};
