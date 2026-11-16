import { format, cents, parseMoney } from "@fluxo/core/kernel/money.ts";
export const money = (n: number, currency = "BRL") =>
  format(cents(n), { currency });
const compactFormatter = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});
const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
export const compact = (n: number) => compactFormatter.format(n / 100);
export const dateLabel = (s: string) =>
  dateFormatter.format(new Date(s + "T12:00:00Z"));
export const monthLabel = (s: string) =>
  monthFormatter
    .format(new Date(s.slice(0, 7) + "-01T12:00:00Z"))
    .replace(".", "");
export const shortMonth = (s: string) => monthLabel(s).split(" de ")[0];
export function inputMoney(value: number) {
  return (value / 100).toFixed(2).replace(".", ",");
}
export function readMoney(value: string) {
  const result = parseMoney(value);
  if (result === null || !Number.isSafeInteger(result))
    throw new Error("Informe um valor monetário válido.");
  return result;
}
export function downloadFile(
  name: string,
  content: string | Blob,
  type = "text/plain",
) {
  const blob =
    typeof content === "string" ? new Blob([content], { type }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csvCell(v: unknown) {
  const str = String(v ?? "");
  return (
    '"' + (/^[=+@\-]/.test(str) ? "\t" : "") + str.replaceAll('"', '""') + '"'
  );
}
