export type EnvSource = Record<string, string | undefined>;

export type PublicEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

const publicEnvKeys = {
  supabaseUrl: "NEXT_PUBLIC_SUPABASE_URL",
  supabaseAnonKey: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
} as const;

function readRequiredEnv(source: EnvSource, key: string) {
  const value = source[key]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function readSupabaseUrl(source: EnvSource) {
  const value = readRequiredEnv(source, publicEnvKeys.supabaseUrl);
  const parsed = new URL(value);

  const isLocalHttp =
    parsed.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(parsed.hostname);
  if (parsed.protocol !== "https:" && !isLocalHttp) {
    throw new Error(`${publicEnvKeys.supabaseUrl} must use https`);
  }

  return value;
}

export function getPublicEnv(source: EnvSource = process.env): PublicEnv {
  return {
    supabaseUrl: readSupabaseUrl(source),
    supabaseAnonKey: readRequiredEnv(source, publicEnvKeys.supabaseAnonKey),
  };
}

export function getBrowserPublicEnv(): PublicEnv {
  return getPublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
