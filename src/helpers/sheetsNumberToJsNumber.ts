export function sheetsNumberToJsFloat(n: string) {
  return parseFloat(n.replace(",", "."));
}
