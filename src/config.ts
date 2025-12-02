import { env } from "./env.js";

export const getPimlicoUrl = (chainId: bigint) => {
	return `https://api.pimlico.io/v2/${chainId.toString()}/rpc?apikey=${
		env.PIMLICO_API_KEY
	}`;
};
