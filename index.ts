import moment from "moment-timezone";
import { DollarDataService } from "./src/dollarDataService";
import { SpreadsheetService } from "./src/spreadsheetService";

async function main() {
  moment.tz.setDefault("America/Buenos_Aires");
  console.log("\n\nSTARTING APP\n\n");
  console.log("Starting services");
  const initPromises = [];

  const spreadsheetService = new SpreadsheetService();

  initPromises.push(spreadsheetService.init());

  const dollarDataService = new DollarDataService(spreadsheetService);

  await Promise.all(initPromises);

  console.log("All services started");

  dollarDataService.appendDollarData();
}

main();
