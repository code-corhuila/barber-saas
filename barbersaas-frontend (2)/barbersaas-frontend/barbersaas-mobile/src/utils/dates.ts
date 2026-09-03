/** Formatea una Date a "YYYY-MM-DD" */
export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getTodayString(): string {
  return toDateString(new Date());
}

export function getStartOfWeekString(): string {
  const date = new Date();
  const day = date.getDay(); // 0=Domingo
  const diff = day === 0 ? 6 : day - 1; // dias desde el lunes
  date.setDate(date.getDate() - diff);
  return toDateString(date);
}

export function getStartOfMonthString(): string {
  const date = new Date();
  date.setDate(1);
  return toDateString(date);
}

/** Ultimo dia del mes actual -- se usa como limite superior por defecto en listas
 * filtradas por mes (ej. facturas), para no ocultar citas ya completadas cuya
 * fecha programada cae mas adelante en el mismo mes. */
export function getEndOfMonthString(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1, 0);
  return toDateString(date);
}

export function formatCurrency(value: number | undefined | null): string {
  return `$${(value ?? 0).toLocaleString('es-CO')}`;
}