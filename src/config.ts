import { env } from "./env.js";

export const getPimlicoUrl = (chainId: number) => {
	return `https://api.pimlico.io/v2/${chainId}/rpc?apikey=${env.PIMLICO_API_KEY}`;
};
