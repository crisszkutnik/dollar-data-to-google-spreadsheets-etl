import moment from "moment-timezone";
import { DollarDataService } from "./src/dollarDataService";
import { SpreadsheetService } from "./src/spreadsheetService";
import { NotificationService } from "./src/notificationService";
import { MetricsService } from "./src/metricsService";

async function main() {
  moment.tz.setDefault("America/Buenos_Aires");
  console.log("\n\nSTARTING APP\n\n");
  console.log("Starting services");
  const initPromises = [];

  const notificationService = new NotificationService();

  try {
    const spreadsheetService = new SpreadsheetService();
    const metricsService = new MetricsService();

    initPromises.push(spreadsheetService.init());

    const dollarDataService = new DollarDataService(
      spreadsheetService,
      notificationService
    );

    await Promise.all(initPromises);

    console.log("All services started");

    dollarDataService.appendDollarData();

    metricsService.setJobRunTimestamp();
    metricsService.sendMetrics();
  } catch (e) {
    notificationService.sendErrorNotification(e);
  }
}

main();
