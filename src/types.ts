interface Env {
  KV: KVNamespace;
  DISCORD_APPLICATION_ID: string;
  DISCORD_PUBLIC_KEY: string;
  DISCORD_TOKEN: string;
  R2: R2Bucket;
  DB: D1Database;
  ASSETS: Fetcher;
}

export type { Env };
