import type { Address } from "viem";
import {
	entryPoint06Address,
	entryPoint07Address,
	entryPoint08Address,
} from "viem/account-abstraction";

const ENTRYPOINT_V6_ADDRESS: Address = entryPoint06Address;
const ENTRYPOINT_V7_ADDRESS: Address = entryPoint07Address;
const ENTRYPOINT_V8_ADDRESS: Address = entryPoint08Address;

export { ENTRYPOINT_V6_ADDRESS, ENTRYPOINT_V7_ADDRESS, ENTRYPOINT_V8_ADDRESS };
