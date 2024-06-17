import { createClient, http } from "viem";
import { env } from "./env.js";
import type { UserOperation } from "permissionless";
import { pimlicoPaymasterActions } from "permissionless/actions/pimlico";
import type { EntryPoint, GetEntryPointVersion } from "permissionless/types";
import { z } from "zod";
import { getPimlicoUrl } from "./config.js";
import * as chains from "viem/chains";

const isTestnet = (chainId: number) => {
	for (const chain of Object.values(chains)) {
		if (chain.id === chainId) {
			return !!chain.testnet;
		}
	}

	return false;
};

export async function getPimlicoContext<entryPoint extends EntryPoint>(
	userOperation: UserOperation<GetEntryPointVersion<entryPoint>>,
	entryPoint: entryPoint,
	chainId: bigint,
	extraParam: unknown,
) {
	if (isTestnet(Number(chainId))) {
		return null;
	}

	const pimlicoClient = createClient({
		transport: http(getPimlicoUrl(chainId)),
	}).extend(pimlicoPaymasterActions(entryPoint));

	const extraParamParsed = z
		.union([
			z.object({
				sponsorshipPolicyIds: z.array(z.string()),
			}),
			z.object({
				sponsorshipPolicyId: z.string(),
			}),
		])
		.nullable()
		.optional()
		.transform((v) => v ?? null)
		.safeParse(extraParam);

	let dappSponsorshipPolicies: string[];
	if (!extraParamParsed.success || !extraParamParsed.data) {
		dappSponsorshipPolicies = [];
	} else {
		dappSponsorshipPolicies =
			"sponsorshipPolicyIds" in extraParamParsed.data
				? extraParamParsed.data.sponsorshipPolicyIds
				: [extraParamParsed.data.sponsorshipPolicyId];
	}

	if (env.PIMLICO_SPONSORSHIP_POLICY_IDS) {
		dappSponsorshipPolicies = new Array(
			...new Set([
				...dappSponsorshipPolicies,
				...env.PIMLICO_SPONSORSHIP_POLICY_IDS,
			]),
		);
	}

	if (dappSponsorshipPolicies.length === 0) {
		return null;
	}

	const validSponsorshipPolicies =
		await pimlicoClient.validateSponsorshipPolicies({
			userOperation: userOperation,
			sponsorshipPolicyIds: dappSponsorshipPolicies,
		});

	if (validSponsorshipPolicies.length === 0) {
		return null;
	}

	return {
		sponsorshipPolicyId: validSponsorshipPolicies[0].sponsorshipPolicyId,
	};
}
