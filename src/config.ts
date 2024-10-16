export const SERVICE_ACCOUNT_EMAIL = process.env
  .SERVICE_ACCOUNT_EMAIL as string;
export const SERVICE_ACCOUNT_KEY = process.env.SERVICE_ACCOUNT_KEY as string;
export const SHEET_ID = process.env.SHEET_ID as string;
export const KEY_BASE64 = Boolean(process.env.KEY_BASE64);
export const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL;
export const DISCORD_NOTIFICATION_CHANNEL_ID = process.env
  .DISCORD_NOTIFICATION_CHANNEL_ID as string;
/*export const PROMETHEUS_PUSHGATEWAY_URL = process.env
  .PROMETHEUS_PUSHGATEWAY_URL as string;*/

export const PROMETHEUS_PUSHGATEWAY_URL = "http://192.168.0.200:32500";
