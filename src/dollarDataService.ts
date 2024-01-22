import type { SpreadsheetService } from "./spreadsheetService";
import type { AllDollarData, DollarData } from "./types/dollarData.type";
import type { RawRow } from "./types/rawRow.interface";
import { getDollarDataFromHistory } from "./helpers/getDollarDataFromHistory";
import moment from "moment-timezone";

const DAY_IN_MS = 8.64e7;

export class DollarDataService {
  constructor(private readonly spreadsheetService: SpreadsheetService) {}

  async appendDollarData() {
    const [lastLoadedRow, dollarData] = await Promise.all([
      this.spreadsheetService.getLastLoadedRow(),
      this.getDollarData(),
    ]);

    const datesToAdd = this.getDatesToAppend(lastLoadedRow);

    console.log(`Dates to append: ${datesToAdd}`);

    if (datesToAdd.length === 0) {
      console.log("No dates to append. Terminating");
      return;
    }

    const rows = this.generateRows(dollarData, datesToAdd, lastLoadedRow);

    console.log("Rows generated");
    console.log(rows);

    await this.spreadsheetService.addRows(rows);

    console.log("Rows appended succesfully");
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

    const responses = await Promise.all(urls.map((u) => fetch(u)));

    const [Oficial, Blue, MEP, CCL, Cripto] = await Promise.all(
      responses.map(async (r) => {
        const ret = await (r.json() as Promise<DollarData>);
        ret.shift();

        const obj = ret.reduce((o, [date, price]) => {
          o[date] = price;
          return o;
        }, {} as Record<string, number>);

        return obj;
      })
    );

    console.log("Fetched all dollar data from Ambito");

    return {
      Oficial,
      Blue,
      MEP,
      CCL,
      Cripto,
    } as AllDollarData;
  }

  getDatesToAppend(lastLoadedRow: RawRow) {
    const today = moment().format("DD/MM/YYYY");

    if (lastLoadedRow.Fecha > today) {
      throw new Error("Can't append data of days that are after today");
    }

    if (lastLoadedRow.Fecha === today) {
      return [];
    }

    const lastDateAsMoment = moment(lastLoadedRow.Fecha, "DD/MM/YYYY");
    let d = moment(lastDateAsMoment.toDate().getTime() + DAY_IN_MS);

    const dates = [];

    dates.push(d.format("DD/MM/YYYY"));

    do {
      d.add(DAY_IN_MS);

      const formattedDate = d.format("DD/MM/YYYY");

      if (formattedDate > today) {
        throw new Error(
          `Trying to append data of a day that is after today. Tried to append data of ${formattedDate} but today is ${today}`
        );
      }

      dates.push(formattedDate);
    } while (d.format("DD/MM/YYYY") !== today);

    return dates;
  }
}
