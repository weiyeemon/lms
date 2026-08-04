"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getBrowserPublicEnv } from "@/lib/env/public";
import type { Database } from "./database.types";

export function createSupabaseBrowserClient() {
  const env = getBrowserPublicEnv();

  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}
