import {
  DISCORD_NOTIFICATION_CHANNEL_ID,
  MAX_ALLOWED_TIME_MS,
  NOTIFICATION_SERVICE_URL,
} from "./config";
import { createLogger } from "./helpers/loggerUtils";

export interface DollarData {
  Oficial: number;
  Blue: number;
  MEP: number;
  CCL: number;
}

export class NotificationService {
  private readonly logger = createLogger(NotificationService.name);

  constructor() {
    if (!NOTIFICATION_SERVICE_URL) {
      this.logger.warn(
        "NOTIFICATION_SERVICE_URL is not set. No notification will be sent"
      );
    }

    if (!DISCORD_NOTIFICATION_CHANNEL_ID) {
      this.logger.warn(
        "DISCORD_NOTIFICATION_CHANNEL_ID is not set. No notification will be sent"
      );
    }
  }

  private async sendDiscordNotification(channelId: string, payload: any) {
    if (!NOTIFICATION_SERVICE_URL) {
      this.logger.warn(
        "NOTIFICATION_SERVICE_URL is not set. No notification will be sent"
      );
      return;
    }

    if (!DISCORD_NOTIFICATION_CHANNEL_ID) {
      this.logger.warn(
        "DISCORD_NOTIFICATION_CHANNEL_ID is not set. No notification will be sent"
      );
      return;
    }

    const endpoint =
      NOTIFICATION_SERVICE_URL + "/notification/discord/" + channelId;

    /*await fetch(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    });*/

    this.logger.info(payload);
  }

  async sendSuccessNotification(today: DollarData, yesterday: DollarData) {
    const body = {
      content: "✅ dollar-price-to-google-sheets run successfully ✅",
      embeds: [
        {
          type: "rich",
          title: "Cotizaciones finales del dia",
          fields: [
            this.createMessage("Oficial", today, yesterday),
            this.createMessage("Blue", today, yesterday),
            this.createMessage("MEP", today, yesterday),
            this.createMessage("CCL", today, yesterday),
          ],
          color: 5763719,
        },
      ],
    };

    await this.sendDiscordNotification(DISCORD_NOTIFICATION_CHANNEL_ID, body);
  }

  async sendErrorNotification(error: unknown) {
    const body = {
      content: "🚨 dollar-price-to-google-sheets failed to run 🚨",
    } as { content: string; embeds: any[] };

    if (error instanceof Error) {
      body.embeds = [
        {
          type: "rich",
          title: "Message",
          description: error.message?.substring(0, 4096),
          color: 15548997,
        },
        {
          type: "rich",
          title: "Stacktrace",
          description: error.stack?.substring(0, 4096),
          color: 15548997,
        },
      ];
    }

    await this.sendDiscordNotification(DISCORD_NOTIFICATION_CHANNEL_ID, body);
  }

  async sendNoRowsToAppendNotification() {
    const body = {
      content:
        "⚠️ dollar-price-to-google-sheets run but there was no rows to append ⚠️",
      embeds: [
        {
          type: "rich",
          description: "The job did run but there were no rows to append",
          color: 16562691,
        },
      ],
    };

    await this.sendDiscordNotification(DISCORD_NOTIFICATION_CHANNEL_ID, body);
  }

  async sendTimedOutNotification() {
    const body = {
      content: `🛑⏳🛑 dollar-price-to-google-sheets timed out after ${MAX_ALLOWED_TIME_MS}ms 🛑⏳🛑`,
      embeds: [
        {
          type: "rich",
          description: "The job run but timed out and was stopped",
          color: 16542467,
        },
      ],
    };

    await this.sendDiscordNotification(DISCORD_NOTIFICATION_CHANNEL_ID, body);
  }

  private createMessage(
    key: keyof DollarData,
    today: DollarData,
    yesterday: DollarData
  ) {
    const todayValue = today[key];
    const yesterdayValue = yesterday[key];

    const diff = todayValue - yesterdayValue;
    const emoji = this.getEmoji(diff);
    const percentageDiff = (todayValue * 100) / yesterdayValue - 100;

    const extraChar = diff >= 0 ? "+" : "";

    return {
      name: key,
      value: `$${todayValue} ${emoji} ${
        extraChar + percentageDiff.toFixed(2)
      } (${extraChar + diff.toFixed(2)})`,
      inline: false,
    };
  }

  private getEmoji(diff: number) {
    if (diff === 0) {
      return "➖";
    }

    if (diff > 0) {
      return "⬆️";
    }

    return "🔻";
  }
}
