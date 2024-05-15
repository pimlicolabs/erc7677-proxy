import { createClient, http } from "viem";
import { env } from "./env";
import { ENTRYPOINT_ADDRESS_V06, type UserOperation } from "permissionless";
import { pimlicoPaymasterActions } from "permissionless/actions/pimlico";
import type {
	ENTRYPOINT_ADDRESS_V06_TYPE,
	ENTRYPOINT_ADDRESS_V07_TYPE,
	EntryPoint,
	GetEntryPointVersion,
} from "permissionless/types";

export async function getPimlicoContext<entryPoint extends EntryPoint>(
	userOperation: UserOperation<GetEntryPointVersion<entryPoint>>,
	entryPoint: entryPoint,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	extraParam: any,
) {
	const pimlicoClient = createClient({
		transport: http(env.PAYMASTER_SERVICE_URL),
	}).extend(pimlicoPaymasterActions(entryPoint));

	const sponsorshipPolicyIds = extraParam ?? env.EXTRA_CONTEXT;

	const validSponsorshipPolicies =
		await pimlicoClient.validateSponsorshipPolicies({
			userOperation: userOperation,
			sponsorshipPolicyIds: env.EXTRA_CONTEXT,
		});

	return {
		sponsorshipPolicyId: validSponsorshipPolicies[0].sponsorshipPolicyId,
	};
}
