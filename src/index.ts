import app from "./app.js";
import { serve } from "@hono/node-server";
import { env } from "./env.js";

export const config = {
	api: {
	  bodyParser: false,
	},
}

const port = env.PORT;
console.log(`Server is running on port ${port}`);

serve({
	fetch: app.fetch,
	port,
});
