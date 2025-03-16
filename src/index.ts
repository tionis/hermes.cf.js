import { Hono, HonoRequest } from "hono";
import { html, raw } from 'hono/html'
import { ContentfulStatusCode } from "hono/utils/http-status";

import { APIInteraction, APIInteractionResponse, InteractionType, InteractionResponseType, MessageFlags } from "discord-api-types/v10";

import { INVITE_COMMAND, ROLL_COMMAND } from "./commands";
import { subtleCrypto, valueToUint8Array, concatUint8Arrays} from "./util";

interface Env {
  DISCORD_TOKEN: string;
  DISCORD_PUBLIC_KEY: string;
  DISCORD_APPLICATION_ID: string;
  KV: KVNamespace;
  R2: R2Bucket;
  DB: D1Database;
  ASSETS: Fetcher;
}

/**
 * Validates a payload from Discord against its signature and key.
 *
 * @param rawBody - The raw payload data
 * @param signature - The signature from the `X-Signature-Ed25519` header
 * @param timestamp - The timestamp from the `X-Signature-Timestamp` header
 * @param clientPublicKey - The public key from the Discord developer dashboard
 * @returns Whether or not validation was successful
 */
export async function verifyKey(
	rawBody: Uint8Array | ArrayBuffer | Buffer | string,
	signature: string,
	timestamp: string,
	clientPublicKey: string | CryptoKey,
): Promise<boolean> {
	try {
		const timestampData = valueToUint8Array(timestamp);
		const bodyData = valueToUint8Array(rawBody);
		const message = concatUint8Arrays(timestampData, bodyData);
		const publicKey =
			typeof clientPublicKey === 'string'
				? await subtleCrypto.importKey(
						'raw',
						valueToUint8Array(clientPublicKey, 'hex'),
						{
							name: 'ed25519',
							namedCurve: 'ed25519',
						},
						false,
						['verify'],
					)
				: clientPublicKey;
		const isValid = await subtleCrypto.verify(
			{
				name: 'ed25519',
			},
			publicKey,
			valueToUint8Array(signature, 'hex'),
			message,
		);
		return isValid;
	} catch (ex) {
		return false;
	}
}

const app = new Hono<{ Bindings: Env }>();

interface DiscordRequestValidation {
  isValid: boolean;
  interaction?: APIInteraction;
}

async function verifyDiscordRequest(
  request: HonoRequest,
  env: Env
): Promise<DiscordRequestValidation> {
  const signature = request.header("x-signature-ed25519");
  const timestamp = request.header("x-signature-timestamp");
  const body = await request.text();
  const isValidRequest = signature &&
    timestamp &&
    (await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY));
  if (!isValidRequest) {
    return { isValid: false };
  }

  return { interaction: JSON.parse(body) as APIInteraction, isValid: true };
}

app.get("/", (c) => {
  return c.html(html`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Hermes</title>
    <link rel="stylesheet" href="/water.css">
  </head>
  <body>
    <h1>Hermes</h1>
  </body>
</html>`)
});

// Add page to roll dice and save the result for some time

app.post("/discord/interactions", async (c) => {
  const validation = await verifyDiscordRequest(c.req, c.env);
  if (!validation.isValid) {
    return c.json({ message: "Bad request signature." }, 401);
  }
  const event = validation.interaction as APIInteraction;
  if (event.type === InteractionType.Ping) {
    return c.json({ type: InteractionResponseType.Pong });
  }
  if (event.type === InteractionType.ApplicationCommand) {
    switch (event.data.name.toLowerCase()) {
      case ROLL_COMMAND.name.toLowerCase(): {
        return c.json({
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: "Placeholder",
          },
        } as APIInteractionResponse);
      }
      case INVITE_COMMAND.name.toLowerCase(): {
        const applicationId = c.env.DISCORD_APPLICATION_ID;
        const INVITE_URL =
          `https://discord.com/oauth2/authorize?client_id=${applicationId}&scope=applications.commands`;
          return c.json({
            type: InteractionResponseType.ChannelMessageWithSource,
            data: {
              content: INVITE_URL,
              flags: MessageFlags.Ephemeral
            },
          })
      }
      default:
        return c.json({ error: "Unknown Command" }, { status: 400 });
    }
  }

  console.error("Unknown Type");
  return c.json({ error: "Unknown Type" }, { status: 400 });
});

app.post("/discord/commands/register", async (c) => {
  const reqToken = c.req.header("Authorization");
  if (reqToken !== c.env.DISCORD_TOKEN) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  /**
   * Register all commands globally.  This can take o(minutes), so wait until
   * you're sure these are the commands you want.
   */
  const url = `https://discord.com/api/v10/applications/${c.env.DISCORD_APPLICATION_ID}/commands`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${c.env.DISCORD_TOKEN}`,
    },
    method: "PUT",
    body: JSON.stringify([INVITE_COMMAND, ROLL_COMMAND]),
  });

  if (response.ok) {
    const data = await response.json();
    return c.json(
      {
        message: "Commands registered",
        data,
      }
    )
  } else {
    try {
      const data = await response.text();
      return c.json({
        message: "Error registering commands",
        status: response.status,
        statusText: response.statusText,
        data: data
      }, response.status as ContentfulStatusCode);
    } catch (e) {
      return c.json({
        message: "Error registering commands (and getting response text)",
        status: response.status,
        statusText: response.statusText,
      }, response.status as ContentfulStatusCode);
    }
  }
});

export default app;