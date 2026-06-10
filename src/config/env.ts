/**
 * Environment configuration for server-side authentication and access.
 *
 * All credentials are loaded from environment variables and validated at startup.
 * These values MUST only be used in server-side code (API routes, server components)
 * — never import this module from client-side code.
 */

export interface EnvConfig {
  /** Quip API access token for Bearer auth */
  QUIP_ACCESS_TOKEN: string;
  /** A-Z leave system access token (SSO/Midway) */
  AZ_ACCESS_TOKEN: string;
  /** Amazon Connect instance ID */
  CONNECT_INSTANCE_ID: string;
  /** Amazon Connect report ARN for real-time metrics */
  CONNECT_REPORT_ARN: string;
}

const REQUIRED_VARS: (keyof EnvConfig)[] = [
  'QUIP_ACCESS_TOKEN',
  'AZ_ACCESS_TOKEN',
  'CONNECT_INSTANCE_ID',
  'CONNECT_REPORT_ARN',
];

/**
 * Loads and validates all required environment variables.
 * Throws if any required variable is missing or empty.
 */
export function loadEnvConfig(): EnvConfig {
  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  return {
    QUIP_ACCESS_TOKEN: process.env.QUIP_ACCESS_TOKEN!,
    AZ_ACCESS_TOKEN: process.env.AZ_ACCESS_TOKEN!,
    CONNECT_INSTANCE_ID: process.env.CONNECT_INSTANCE_ID!,
    CONNECT_REPORT_ARN: process.env.CONNECT_REPORT_ARN!,
  };
}

/**
 * Returns a single validated env config instance.
 * Call this from server-side code (API routes, server actions) only.
 */
let _cached: EnvConfig | null = null;

export function getEnvConfig(): EnvConfig {
  if (!_cached) {
    _cached = loadEnvConfig();
  }
  return _cached;
}

/**
 * Extended environment configuration for the email automation feature.
 * Includes SharePoint, Outlook, scheduler, and logging variables.
 */
export interface EmailAutomationEnvConfig extends EnvConfig {
  SHAREPOINT_SITE_URL: string;
  SHAREPOINT_LIST_ID: string;
  SHAREPOINT_ACCESS_TOKEN: string;
  OUTLOOK_CLIENT_ID: string;
  OUTLOOK_CLIENT_SECRET: string;
  OUTLOOK_TENANT_ID: string;
  OUTLOOK_SENDER_EMAIL: string;
  SCHEDULE_CRON_EXPRESSION: string;
  RUN_LOG_DIRECTORY: string;
}

const EMAIL_AUTOMATION_REQUIRED_VARS: (keyof EmailAutomationEnvConfig)[] = [
  'SHAREPOINT_SITE_URL',
  'SHAREPOINT_LIST_ID',
  'SHAREPOINT_ACCESS_TOKEN',
  'OUTLOOK_CLIENT_ID',
  'OUTLOOK_CLIENT_SECRET',
  'OUTLOOK_TENANT_ID',
];

const EMAIL_AUTOMATION_DEFAULTS: Partial<Record<keyof EmailAutomationEnvConfig, string>> = {
  OUTLOOK_SENDER_EMAIL: 'mpuranik@amazon.com',
  SCHEDULE_CRON_EXPRESSION: '0 17 * * 2',
  RUN_LOG_DIRECTORY: './logs/email-automation',
};

/**
 * Loads and validates all required email automation environment variables.
 * Throws if any required variable is missing or empty.
 * Applies defaults for optional variables when not set.
 */
export function loadEmailAutomationEnvConfig(): EmailAutomationEnvConfig {
  const baseConfig = loadEnvConfig();

  const missing: string[] = [];

  for (const key of EMAIL_AUTOMATION_REQUIRED_VARS) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  return {
    ...baseConfig,
    SHAREPOINT_SITE_URL: process.env.SHAREPOINT_SITE_URL!,
    SHAREPOINT_LIST_ID: process.env.SHAREPOINT_LIST_ID!,
    SHAREPOINT_ACCESS_TOKEN: process.env.SHAREPOINT_ACCESS_TOKEN!,
    OUTLOOK_CLIENT_ID: process.env.OUTLOOK_CLIENT_ID!,
    OUTLOOK_CLIENT_SECRET: process.env.OUTLOOK_CLIENT_SECRET!,
    OUTLOOK_TENANT_ID: process.env.OUTLOOK_TENANT_ID!,
    OUTLOOK_SENDER_EMAIL: process.env.OUTLOOK_SENDER_EMAIL?.trim() || EMAIL_AUTOMATION_DEFAULTS.OUTLOOK_SENDER_EMAIL!,
    SCHEDULE_CRON_EXPRESSION: process.env.SCHEDULE_CRON_EXPRESSION?.trim() || EMAIL_AUTOMATION_DEFAULTS.SCHEDULE_CRON_EXPRESSION!,
    RUN_LOG_DIRECTORY: process.env.RUN_LOG_DIRECTORY?.trim() || EMAIL_AUTOMATION_DEFAULTS.RUN_LOG_DIRECTORY!,
  };
}
