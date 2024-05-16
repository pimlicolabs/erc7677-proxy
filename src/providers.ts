import { createClient, http } from "viem";
import { env } from "./env.js";
import type { UserOperation } from "permissionless";
import { pimlicoPaymasterActions } from "permissionless/actions/pimlico";
import type { EntryPoint, GetEntryPointVersion } from "permissionless/types";
import { z } from "zod";

export async function getPimlicoContext<entryPoint extends EntryPoint>(
	userOperation: UserOperation<GetEntryPointVersion<entryPoint>>,
	entryPoint: entryPoint,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	extraParam: any,
) {
	const pimlicoClient = createClient({
		transport: http(env.PAYMASTER_SERVICE_URL),
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
