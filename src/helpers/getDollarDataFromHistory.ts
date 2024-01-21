import type { AllDollarData } from "../types/dollarData.type";
import type { RawRow } from "../types/rawRow.interface";
import { jsNumberToSheetsNumber } from "./jsNumberToSheetsNumber";

type Key = keyof AllDollarData;

export function getDollarDataFromHistory(
  dollarData: AllDollarData,
  key: Key,
  date: string,
  prevRow: RawRow
) {
  const dayEntry = dollarData[key][date];

  if (dayEntry) {
    return jsNumberToSheetsNumber(dayEntry);
  }

  return prevRow[key];
}
