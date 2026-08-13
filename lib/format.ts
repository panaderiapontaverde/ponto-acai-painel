/**
 * Helpers de formatação compartilhados por todas as telas.
 *
 * Regra do projeto: valor ausente NUNCA vira zero. `null`/`undefined`
 * viram "—" (ou um texto explícito), porque "não coletamos" e "foi zero"
 * são coisas diferentes e confundi-las leva a decisão errada.
 */

export function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatInt(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR");
}

export function formatDecimal(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/**
 * As colunas de taxa (cancel_rate, calls_rate, store_response_rate) vêm do
 * banco já em pontos percentuais (1 = 1%), não como fração 0–1.
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

/** Converte 'YYYY-MM-DD' em 'DD/MM/AAAA' sem passar por Date (evita bug de fuso). */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.slice(0, 10).split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

export function formatPeriod(
  start: string | null | undefined,
  end: string | null | undefined
): string {
  if (!start && !end) return "—";
  if (start === end) return formatDate(start);
  return `${formatDate(start)} a ${formatDate(end)}`;
}

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function formatMonth(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const [y, m] = dateStr.slice(0, 10).split("-");
  const index = Number(m) - 1;
  if (Number.isNaN(index) || !MONTHS[index]) return dateStr;
  return `${MONTHS[index]}/${y}`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export interface Delta {
  absolute: number;
  percent: number | null;
  direction: "up" | "down" | "flat";
}

/**
 * Variação entre dois valores comparáveis. Devolve `null` quando falta
 * qualquer um dos lados — sem base de comparação não existe variação, e
 * inventar "0%" nesse caso seria mentira.
 */
export function computeDelta(
  current: number | null | undefined,
  previous: number | null | undefined
): Delta | null {
  if (current === null || current === undefined) return null;
  if (previous === null || previous === undefined) return null;

  const absolute = current - previous;
  const percent = previous === 0 ? null : (absolute / Math.abs(previous)) * 100;
  const direction = absolute > 0 ? "up" : absolute < 0 ? "down" : "flat";

  return { absolute, percent, direction };
}

/** Rótulo curto de variação, ex.: "+12,3% vs dia anterior". */
export function formatDelta(delta: Delta | null, suffix: string): string | undefined {
  if (!delta) return undefined;
  if (delta.percent === null) {
    return `${delta.absolute >= 0 ? "+" : ""}${formatDecimal(delta.absolute, 2)} ${suffix}`;
  }
  const sign = delta.percent >= 0 ? "+" : "";
  return `${sign}${formatDecimal(delta.percent, 1)}% ${suffix}`;
}
