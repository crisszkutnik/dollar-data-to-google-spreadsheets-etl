import moment from "moment-timezone";
import { DollarDataService } from "./src/dollarDataService";
import { SpreadsheetService } from "./src/spreadsheetService";
import { NotificationService } from "./src/notificationService";
import { createLogger } from "./src/helpers/loggerUtils";
import { MAX_ALLOWED_TIME_MS } from "./src/config";

class JobTimedOutError extends Error {
  constructor() {
    super("Job timed out");
    this.name = "JobTimedOutError";
  }
}

function withTimeout<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    // 5 minutes
    const timeoutId = setTimeout(
      () => reject(new JobTimedOutError()),
      MAX_ALLOWED_TIME_MS
    );

    fn().then((result) => {
      clearTimeout(timeoutId);
      resolve(result);
    });
  });
}

async function main() {
  moment.tz.setDefault("America/Buenos_Aires");

  const logger = createLogger("index.ts");

  logger.info("Starting services");
  const initPromises: Promise<unknown>[] = [];

  const notificationService = new NotificationService();

  try {
    await withTimeout(async () => {
      const spreadsheetService = new SpreadsheetService();

      initPromises.push(spreadsheetService.init());

      const dollarDataService = new DollarDataService(
        spreadsheetService,
        notificationService
      );

      await Promise.all(initPromises);

      logger.info("All services started");

      await dollarDataService.appendDollarData();
    });
  } catch (e) {
    if (e instanceof JobTimedOutError) {
      await notificationService.sendTimedOutNotification();
    } else {
      await notificationService.sendErrorNotification(e);
    }
  }
}

main();
