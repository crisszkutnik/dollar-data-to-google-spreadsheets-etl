import { JWT } from "google-auth-library";
import {
  GoogleSpreadsheet,
  GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";
import type { RawRow } from "./types/rawRow.interface";
import { SERVICE_ACCOUNT_EMAIL, SERVICE_ACCOUNT_KEY, SHEET_ID } from "./config";

export class SpreadsheetService {
  private doc: GoogleSpreadsheet;
  private sheet: GoogleSpreadsheetWorksheet | undefined = undefined;

  private lastRowIdx: number = -1;

  constructor() {
    const auth = new JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: SERVICE_ACCOUNT_KEY,
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file",
      ],
    });
    this.doc = new GoogleSpreadsheet(SHEET_ID, auth);
  }

  async init() {
    await this.doc.loadInfo();
    this.sheet = this.doc.sheetsByTitle["Dolar"];
    console.log("Started SpreadsheetService");
  }

  async getLastLoadedRow() {
    if (this.sheet === undefined) {
      throw new Error("Sheet is not initialized");
    }

    const lastRowIdx = this.getLastRowIdx();
    const rows = await this.sheet.getRows({ offset: lastRowIdx });

    if (!rows) {
      throw new Error("Fatal error fetching last row");
    }

    const row = rows[0].toObject() as RawRow;
    return row;
  }

  async addRows(rows: RawRow[]) {
    this.sheet?.addRows(rows as any[]);
  }

  private getLastRowIdx() {
    if (this.lastRowIdx === -1) {
      if (this.sheet === undefined) {
        throw new Error("Sheet is not initialized");
      }

      this.lastRowIdx = this.sheet.rowCount - 2;
    }

    return this.lastRowIdx;
  }
}
