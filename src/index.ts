import { Hono } from "hono";
import { handle_interaction } from "./discord";
import { Env } from "./types.ts";

const app = new Hono<{ Bindings: Env }>();

async function verifyDiscordRequest(request, env: Env) {
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  const body = await request.text();
  const isValidRequest = signature &&
    timestamp &&
    (await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
  if (!isValidRequest) {
    return { isValid: false };
  }

  return { interaction: JSON.parse(body), isValid: true };
}

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/discord/interactions", (c) => {
  handle_interaction(c);
});

export default app;
