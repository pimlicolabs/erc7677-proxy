import { getAddress } from "viem";
import z from "zod/v4";

const addressPattern = /^0x[0-9,a-f,A-F]{40}$/;

const addressSchema = z
	.string()
	.regex(addressPattern, { message: "not a valid hex address" })
	.transform((val) => getAddress(val));

export { addressSchema };
