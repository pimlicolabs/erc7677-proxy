import { type Hex, maxUint256 } from "viem";
import z from "zod/v4";
import { addressSchema } from "./address";

const hexDataPattern = /^0x[0-9A-Fa-f]*$/;

const hexNumberSchema = z
	.string()
	.regex(hexDataPattern)
	.or(z.number())
	.or(z.bigint())
	.check((ctx) => {
		// This function is used to refine the input and provide a context where you have access to the path.
		try {
			if (ctx.value === "0x") {
				return;
			}

			const bigIntData = BigInt(ctx.value); // Attempt to convert to BigInt to validate it can be done

			if (bigIntData > maxUint256) {
				ctx.issues.push({
					code: "custom",
					message:
						"Invalid hexNumber, hexNumber cannot be greater than MAX_UINT_256",
					input: ctx.value,
				});
			}
		} catch {
			ctx.issues.push({
				code: "custom",
				message:
					"Invalid input, expected a value that can be converted to bigint.",
				input: ctx.value,
			});
		}
	})
	.transform((val) => {
		if (val === "0x") {
			return 0n;
		}

		return BigInt(val);
	});

const hexDataSchema = z
	.string()
	.regex(hexDataPattern, { message: "not valid hex data" })
	.max(1000000, {
		message: "hex data too long, maximum length is 500,000 bytes",
	})
	.transform((val) => val.toLowerCase() as Hex);

export { addressSchema, hexNumberSchema, hexDataSchema };
