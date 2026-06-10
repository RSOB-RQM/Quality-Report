import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadEnvConfig, loadEmailAutomationEnvConfig } from './env';

describe('loadEnvConfig', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('returns config when all required variables are set', () => {
    process.env.QUIP_ACCESS_TOKEN = 'quip-token';
    process.env.AZ_ACCESS_TOKEN = 'az-token';
    process.env.CONNECT_INSTANCE_ID = 'instance-123';
    process.env.CONNECT_REPORT_ARN = 'arn:aws:connect:us-east-1:123:instance/abc/report/def';

    const config = loadEnvConfig();

    expect(config.QUIP_ACCESS_TOKEN).toBe('quip-token');
    expect(config.AZ_ACCESS_TOKEN).toBe('az-token');
    expect(config.CONNECT_INSTANCE_ID).toBe('instance-123');
    expect(config.CONNECT_REPORT_ARN).toBe('arn:aws:connect:us-east-1:123:instance/abc/report/def');
  });

  it('throws when all variables are missing', () => {
    delete process.env.QUIP_ACCESS_TOKEN;
    delete process.env.AZ_ACCESS_TOKEN;
    delete process.env.CONNECT_INSTANCE_ID;
    delete process.env.CONNECT_REPORT_ARN;

    expect(() => loadEnvConfig()).toThrow('Missing required environment variables');
  });

  it('throws listing each missing variable', () => {
    process.env.QUIP_ACCESS_TOKEN = 'quip-token';
    delete process.env.AZ_ACCESS_TOKEN;
    delete process.env.CONNECT_INSTANCE_ID;
    process.env.CONNECT_REPORT_ARN = 'some-arn';

    expect(() => loadEnvConfig()).toThrow('AZ_ACCESS_TOKEN, CONNECT_INSTANCE_ID');
  });

  it('treats empty strings as missing', () => {
    process.env.QUIP_ACCESS_TOKEN = '';
    process.env.AZ_ACCESS_TOKEN = 'az-token';
    process.env.CONNECT_INSTANCE_ID = 'instance-123';
    process.env.CONNECT_REPORT_ARN = 'some-arn';

    expect(() => loadEnvConfig()).toThrow('QUIP_ACCESS_TOKEN');
  });

  it('treats whitespace-only strings as missing', () => {
    process.env.QUIP_ACCESS_TOKEN = '   ';
    process.env.AZ_ACCESS_TOKEN = 'az-token';
    process.env.CONNECT_INSTANCE_ID = 'instance-123';
    process.env.CONNECT_REPORT_ARN = 'some-arn';

    expect(() => loadEnvConfig()).toThrow('QUIP_ACCESS_TOKEN');
  });
});

describe('loadEmailAutomationEnvConfig', () => {
  const ORIGINAL_ENV = process.env;

  const BASE_ENV = {
    QUIP_ACCESS_TOKEN: 'quip-token',
    AZ_ACCESS_TOKEN: 'az-token',
    CONNECT_INSTANCE_ID: 'instance-123',
    CONNECT_REPORT_ARN: 'arn:aws:connect:us-east-1:123:instance/abc/report/def',
  };

  const EMAIL_REQUIRED_ENV = {
    SHAREPOINT_SITE_URL: 'https://share.amazon.com/sites/test',
    SHAREPOINT_LIST_ID: 'list-abc-123',
    SHAREPOINT_ACCESS_TOKEN: 'sp-token',
    OUTLOOK_CLIENT_ID: 'outlook-client-id',
    OUTLOOK_CLIENT_SECRET: 'outlook-client-secret',
    OUTLOOK_TENANT_ID: 'outlook-tenant-id',
  };

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV, ...BASE_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('returns config with defaults when all required variables are set', () => {
    Object.assign(process.env, EMAIL_REQUIRED_ENV);

    const config = loadEmailAutomationEnvConfig();

    expect(config.SHAREPOINT_SITE_URL).toBe('https://share.amazon.com/sites/test');
    expect(config.SHAREPOINT_LIST_ID).toBe('list-abc-123');
    expect(config.SHAREPOINT_ACCESS_TOKEN).toBe('sp-token');
    expect(config.OUTLOOK_CLIENT_ID).toBe('outlook-client-id');
    expect(config.OUTLOOK_CLIENT_SECRET).toBe('outlook-client-secret');
    expect(config.OUTLOOK_TENANT_ID).toBe('outlook-tenant-id');
    expect(config.OUTLOOK_SENDER_EMAIL).toBe('mpuranik@amazon.com');
    expect(config.SCHEDULE_CRON_EXPRESSION).toBe('0 17 * * 2');
    expect(config.RUN_LOG_DIRECTORY).toBe('./logs/email-automation');
  });

  it('uses custom values when optional variables are provided', () => {
    Object.assign(process.env, EMAIL_REQUIRED_ENV, {
      OUTLOOK_SENDER_EMAIL: 'custom@amazon.com',
      SCHEDULE_CRON_EXPRESSION: '0 9 * * 1',
      RUN_LOG_DIRECTORY: '/var/logs/custom',
    });

    const config = loadEmailAutomationEnvConfig();

    expect(config.OUTLOOK_SENDER_EMAIL).toBe('custom@amazon.com');
    expect(config.SCHEDULE_CRON_EXPRESSION).toBe('0 9 * * 1');
    expect(config.RUN_LOG_DIRECTORY).toBe('/var/logs/custom');
  });

  it('includes base EnvConfig fields', () => {
    Object.assign(process.env, EMAIL_REQUIRED_ENV);

    const config = loadEmailAutomationEnvConfig();

    expect(config.QUIP_ACCESS_TOKEN).toBe('quip-token');
    expect(config.AZ_ACCESS_TOKEN).toBe('az-token');
    expect(config.CONNECT_INSTANCE_ID).toBe('instance-123');
    expect(config.CONNECT_REPORT_ARN).toBe('arn:aws:connect:us-east-1:123:instance/abc/report/def');
  });

  it('throws listing all missing email automation variables', () => {
    // No email automation vars set
    expect(() => loadEmailAutomationEnvConfig()).toThrow(
      'Missing required environment variables: SHAREPOINT_SITE_URL, SHAREPOINT_LIST_ID, SHAREPOINT_ACCESS_TOKEN, OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET, OUTLOOK_TENANT_ID'
    );
  });

  it('throws listing only the missing variables', () => {
    Object.assign(process.env, {
      SHAREPOINT_SITE_URL: 'https://share.amazon.com/sites/test',
      SHAREPOINT_LIST_ID: 'list-abc-123',
      // SHAREPOINT_ACCESS_TOKEN missing
      OUTLOOK_CLIENT_ID: 'outlook-client-id',
      // OUTLOOK_CLIENT_SECRET missing
      OUTLOOK_TENANT_ID: 'outlook-tenant-id',
    });

    expect(() => loadEmailAutomationEnvConfig()).toThrow(
      'SHAREPOINT_ACCESS_TOKEN, OUTLOOK_CLIENT_SECRET'
    );
  });

  it('treats empty strings as missing for required variables', () => {
    Object.assign(process.env, EMAIL_REQUIRED_ENV, {
      SHAREPOINT_SITE_URL: '',
    });

    expect(() => loadEmailAutomationEnvConfig()).toThrow('SHAREPOINT_SITE_URL');
  });

  it('treats whitespace-only strings as missing for required variables', () => {
    Object.assign(process.env, EMAIL_REQUIRED_ENV, {
      OUTLOOK_CLIENT_ID: '   ',
    });

    expect(() => loadEmailAutomationEnvConfig()).toThrow('OUTLOOK_CLIENT_ID');
  });

  it('falls back to defaults when optional variables are empty strings', () => {
    Object.assign(process.env, EMAIL_REQUIRED_ENV, {
      OUTLOOK_SENDER_EMAIL: '',
      SCHEDULE_CRON_EXPRESSION: '',
      RUN_LOG_DIRECTORY: '',
    });

    const config = loadEmailAutomationEnvConfig();

    expect(config.OUTLOOK_SENDER_EMAIL).toBe('mpuranik@amazon.com');
    expect(config.SCHEDULE_CRON_EXPRESSION).toBe('0 17 * * 2');
    expect(config.RUN_LOG_DIRECTORY).toBe('./logs/email-automation');
  });

  it('throws for missing base config variables even when email vars are set', () => {
    delete process.env.QUIP_ACCESS_TOKEN;
    Object.assign(process.env, EMAIL_REQUIRED_ENV);

    expect(() => loadEmailAutomationEnvConfig()).toThrow('QUIP_ACCESS_TOKEN');
  });
});
