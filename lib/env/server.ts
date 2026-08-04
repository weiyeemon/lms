import { getPublicEnv, type EnvSource, type PublicEnv } from "./public";

export type GmailSmtpEnv = {
  host: string;
  port: number;
  user: string;
  appPassword: string;
  fromAddress: string;
  fromName: string;
};

export type ServerEnv = {
  public: PublicEnv;
  gmailSmtp: GmailSmtpEnv | null;
};

const gmailEnvKeys = {
  host: "GMAIL_SMTP_HOST",
  port: "GMAIL_SMTP_PORT",
  user: "GMAIL_SMTP_USER",
  appPassword: "GMAIL_SMTP_APP_PASSWORD",
  fromAddress: "EMAIL_FROM_ADDRESS",
} as const;

function readOptionalValue(source: EnvSource, key: string) {
  const value = source[key]?.trim();
  return value ? value : undefined;
}

function parseGmailPort(value: string) {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${gmailEnvKeys.port} must be an integer between 1 and 65535`);
  }

  return port;
}

function getGmailSmtpEnv(source: EnvSource): GmailSmtpEnv | null {
  const values = {
    host: readOptionalValue(source, gmailEnvKeys.host),
    port: readOptionalValue(source, gmailEnvKeys.port),
    user: readOptionalValue(source, gmailEnvKeys.user),
    appPassword: readOptionalValue(source, gmailEnvKeys.appPassword),
    fromAddress: readOptionalValue(source, gmailEnvKeys.fromAddress),
    fromName: readOptionalValue(source, "EMAIL_FROM_NAME") ?? "Leave Management",
  };

  const hasAnyGmailSetting = [
    ...Object.values(gmailEnvKeys),
    "EMAIL_FROM_NAME",
  ].some((key) => Boolean(readOptionalValue(source, key)));
  const hasRequiredGmailSetting = Object.keys(gmailEnvKeys).some(
    (name) => Boolean(values[name as keyof typeof gmailEnvKeys]),
  );

  if (!hasAnyGmailSetting && !hasRequiredGmailSetting) {
    return null;
  }

  const missingKeys = Object.entries(gmailEnvKeys)
    .filter(([name]) => !values[name as keyof typeof gmailEnvKeys])
    .map(([, key]) => key);

  if (missingKeys.length > 0) {
    throw new Error(
      `Incomplete Gmail SMTP configuration. Missing: ${missingKeys.join(", ")}`,
    );
  }

  return {
    host: values.host!,
    port: parseGmailPort(values.port!),
    user: values.user!,
    appPassword: values.appPassword!,
    fromAddress: values.fromAddress!,
    fromName: values.fromName,
  };
}

export function getServerEnv(source: EnvSource = process.env): ServerEnv {
  return {
    public: getPublicEnv(source),
    gmailSmtp: getGmailSmtpEnv(source),
  };
}
