import { JWT } from "google-auth-library";
import {
  GoogleSpreadsheet,
  GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";
import type { RawRow } from "./types/rawRow.interface";
import {
  KEY_BASE64,
  SERVICE_ACCOUNT_EMAIL,
  SERVICE_ACCOUNT_KEY,
  SHEET_ID,
} from "./config";

export class SpreadsheetService {
  private doc: GoogleSpreadsheet;
  private sheet: GoogleSpreadsheetWorksheet | undefined = undefined;

  constructor() {
    const auth = new JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: KEY_BASE64
        ? Buffer.from(SERVICE_ACCOUNT_KEY, "base64").toString()
        : SERVICE_ACCOUNT_KEY,
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

  async getLastTwoRows() {
    const rows = await this.sheet?.getRows({
      offset: this.getLastRowIdx() - 1,
    });

    if (!rows) {
      throw new Error("Fatal error fetching last two rows");
    }

    return rows.map((r) => r.toObject()) as [RawRow, RawRow];
  }

  async addRows(rows: RawRow[]) {
    await this.sheet?.addRows(rows as any[]);
  }

  private getLastRowIdx() {
    if (this.sheet === undefined) {
      throw new Error("Sheet is not initialized");
    }

    return this.sheet.rowCount - 2;
  }
}
