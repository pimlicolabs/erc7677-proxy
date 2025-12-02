import { type Address, type Chain, http } from "viem";
import { env } from "./env.js";
import { getPimlicoUrl } from "./config.js";
import {
	type EntryPointVersion,
	type UserOperation,
} from "viem/account-abstraction";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { type PaymasterContext } from "./schemas/paymaster-context.js";

export type PimlicoContextResult =
	| {
			result: "sponsor";
			extraParam: { sponsorshipPolicyId: string } | null;
	  }
	| {
			result: "reject";
	  };

export async function getPimlicoContext({
	userOperation,
	entryPoint,
	chain,
	context,
}: {
	userOperation: UserOperation;
	entryPoint: {
		address: Address;
		version: EntryPointVersion;
	};
	chain: Chain;
	context: PaymasterContext;
}): Promise<PimlicoContextResult> {
	if (chain.testnet) {
		return { result: "sponsor", extraParam: null };
	}

	const pimlicoClient = createPimlicoClient({
		transport: http(getPimlicoUrl(chain.id)),
		entryPoint,
	});

	const contextPolicies: string[] = !context
		? []
		: "sponsorshipPolicyIds" in context
			? context.sponsorshipPolicyIds
			: [context.sponsorshipPolicyId];

	const dappSponsorshipPolicies = [
		...new Set([
			...contextPolicies,
			...(env.PIMLICO_SPONSORSHIP_POLICY_IDS ?? []),
		]),
	];

	if (dappSponsorshipPolicies.length === 0) {
		return { result: "sponsor", extraParam: null };
	}

	const validSponsorshipPolicies =
		await pimlicoClient.validateSponsorshipPolicies({
			userOperation,
			sponsorshipPolicyIds: dappSponsorshipPolicies,
		});

	if (validSponsorshipPolicies.length === 0) {
		return { result: "reject" };
	}

	return {
		result: "sponsor",
		extraParam: {
			sponsorshipPolicyId: validSponsorshipPolicies[0].sponsorshipPolicyId,
		},
	};
}
