import type { SpreadsheetService } from "./spreadsheetService";
import type { AllDollarData, AmbitoDollarData } from "./types/dollarData.type";
import type { RawRow } from "./types/rawRow.interface";
import { getDollarDataFromHistory } from "./helpers/getDollarDataFromHistory";
import moment from "moment-timezone";
import { sheetsNumberToJsFloat } from "./helpers/sheetsNumberToJsNumber";
import type { DollarData, NotificationService } from "./notificationService";
import { createLogger } from "./helpers/loggerUtils";

const DAY_IN_MS = 8.64e7;

export class DollarDataService {
  private readonly logger = createLogger(DollarDataService.name);

  constructor(
    private readonly spreadsheetService: SpreadsheetService,
    private readonly notificationService: NotificationService
  ) {}

  async appendDollarData() {
    this.logger.info("Fetching required data");
    const [lastLoadedRow, dollarData] = await Promise.all([
      this.spreadsheetService.getLastLoadedRow(),
      this.getDollarData(),
    ]);

    this.logger.info("Fetched all required data");

    const datesToAdd = this.getDatesToAppend(lastLoadedRow);

    this.logger.info(`Dates to append: ${datesToAdd}`);

    if (datesToAdd.length === 0) {
      this.logger.info("No dates to append. Terminating");
      await this.notificationService.sendNoRowsToAppendNotification();
      return;
    }

    const rows = this.generateRows(dollarData, datesToAdd, lastLoadedRow);

    this.logger.info("Rows generated");
    this.logger.info(JSON.stringify(rows));

    await this.spreadsheetService.addRows(rows);

    this.logger.info("Rows appended succesfully");

    await this.sendSuccessNotification();
  }

  private async sendSuccessNotification() {
    const data = (await this.spreadsheetService.getLastTwoRows()).map((d) => ({
      Oficial: sheetsNumberToJsFloat(d.Oficial),
      MEP: sheetsNumberToJsFloat(d.MEP),
      CCL: sheetsNumberToJsFloat(d.CCL),
      Blue: sheetsNumberToJsFloat(d.Blue),
    })) as DollarData[];

    const [yesterday, today] = data;

    await this.notificationService.sendSuccessNotification(today, yesterday);
  }

  private generateRows(
    dollarData: AllDollarData,
    datesToAdd: string[],
    lastLoadedRow: RawRow
  ) {
    const rows: RawRow[] = [];

    for (const date of datesToAdd) {
      const prevRow = rows.length > 0 ? rows[rows.length - 1] : lastLoadedRow;

      const row = {
        Fecha: date,
        "Anio/mes": moment(date, "DD/MM/YYYY").format("YYYYMM"),
        Oficial: getDollarDataFromHistory(dollarData, "Oficial", date, prevRow),
        Blue: getDollarDataFromHistory(dollarData, "Blue", date, prevRow),
        MEP: getDollarDataFromHistory(dollarData, "MEP", date, prevRow),
        CCL: getDollarDataFromHistory(dollarData, "CCL", date, prevRow),
        Cripto: getDollarDataFromHistory(dollarData, "Cripto", date, prevRow),
      } as RawRow;

      rows.push(row);
    }

    return rows;
  }

  private async getDollarData(): Promise<AllDollarData> {
    const urls = [
      "https://mercados.ambito.com/dolar/oficial/grafico/anual",
      "https://mercados.ambito.com/dolar/informal/grafico/anual",
      "https://mercados.ambito.com/dolarrava/mep/grafico/anual",
      "https://mercados.ambito.com/dolarrava/cl/grafico/anual",
      "https://mercados.ambito.com/dolarcripto/grafico/anual",
    ];

    this.logger.info("Fetching dollar data from Ambito");

    const responses = await Promise.all(urls.map((u) => fetch(u)));

    const [Oficial, Blue, MEP, CCL, Cripto] = await Promise.all(
      responses.map(async (r) => {
        const ret = await (r.json() as Promise<AmbitoDollarData>);
        ret.shift();

        const obj = ret.reduce((o, [date, price]) => {
          o[date] = price;
          return o;
        }, {} as Record<string, number>);

        return obj;
      })
    );

    this.logger.info("Dollar data retrieved from Ambito");

    return {
      Oficial,
      Blue,
      MEP,
      CCL,
      Cripto,
    } as AllDollarData;
  }

  getDatesToAppend(lastLoadedRow: RawRow) {
    const todayAsISO = moment().format("YYYY-MM-DD");

    const lastDateAsMoment = moment(lastLoadedRow.Fecha, "DD/MM/YYYY");
    const lastDateAsISO = lastDateAsMoment.format("YYYY-MM-DD");

    if (lastDateAsISO > todayAsISO) {
      throw new Error("Can't append data of days that are after today");
    }

    if (lastDateAsISO === todayAsISO) {
      return [];
    }

    const d = moment(lastDateAsMoment.toDate().getTime() + DAY_IN_MS);

    const dates = [];

    let formattedDateISO: string;
    do {
      formattedDateISO = d.format("YYYY-MM-DD");

      if (formattedDateISO > todayAsISO) {
        throw new Error(
          `Trying to append data of a day that is after today. Tried to append data of ${formattedDateISO} but today is ${todayAsISO}`
        );
      }

      dates.push(d.format("DD/MM/YYYY"));
      d.add(DAY_IN_MS);
    } while (formattedDateISO !== todayAsISO);

    return dates;
  }
}
