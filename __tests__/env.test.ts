import { afterEach, describe, expect, test, vi } from "vitest";

import { getBrowserPublicEnv, getPublicEnv } from "@/lib/env/public";
import { getServerEnv } from "@/lib/env/server";

const validPublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key",
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("public environment validation", () => {
  test("rejects missing required Supabase public configuration", () => {
    expect(() => getPublicEnv({})).toThrow(
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL",
    );
  });

  test("accepts a complete valid Supabase public configuration", () => {
    expect(getPublicEnv(validPublicEnv)).toEqual({
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "public-anon-key",
    });
  });

  test("allows HTTP only for local Supabase development", () => {
    expect(
      getPublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key",
      }),
    ).toEqual({
      supabaseUrl: "http://127.0.0.1:54321",
      supabaseAnonKey: "local-anon-key",
    });
  });

  test("reads browser configuration from literal NEXT_PUBLIC keys", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", validPublicEnv.NEXT_PUBLIC_SUPABASE_URL);
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      validPublicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );

    expect(getBrowserPublicEnv()).toEqual({
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "public-anon-key",
    });
  });
});

describe("server environment validation", () => {
  test("does not require Gmail SMTP configuration", () => {
    expect(getServerEnv(validPublicEnv).gmailSmtp).toBeNull();
  });

  test("accepts complete Gmail SMTP configuration", () => {
    expect(
      getServerEnv({
        ...validPublicEnv,
        GMAIL_SMTP_HOST: "smtp.gmail.com",
        GMAIL_SMTP_PORT: "587",
        GMAIL_SMTP_USER: "leave@example.com",
        GMAIL_SMTP_APP_PASSWORD: "app-password",
        EMAIL_FROM_ADDRESS: "leave@example.com",
        EMAIL_FROM_NAME: "Leave Desk",
      }).gmailSmtp,
    ).toEqual({
      host: "smtp.gmail.com",
      port: 587,
      user: "leave@example.com",
      appPassword: "app-password",
      fromAddress: "leave@example.com",
      fromName: "Leave Desk",
    });
  });

  test("rejects partial Gmail SMTP configuration", () => {
    expect(() =>
      getServerEnv({
        ...validPublicEnv,
        GMAIL_SMTP_HOST: "smtp.gmail.com",
      }),
    ).toThrow(
      "Incomplete Gmail SMTP configuration. Missing: GMAIL_SMTP_PORT, GMAIL_SMTP_USER, GMAIL_SMTP_APP_PASSWORD, EMAIL_FROM_ADDRESS",
    );
  });
});
