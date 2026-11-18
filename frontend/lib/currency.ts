// All money in the app is Pakistani Rupees (PKR).
export const CURRENCY_CODE = 'PKR';
export const CURRENCY_SYMBOL = 'Rs';

const formatter = new Intl.NumberFormat('en-PK', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

// e.g. 1250000 -> "Rs 1,250,000", -500 -> "-Rs 500"
export function formatPKR(value: number | string | null | undefined): string {
  const n = Number(value);
  if (value === null || value === undefined || value === '' || !Number.isFinite(n)) {
    return `${CURRENCY_SYMBOL} 0`;
  }
  return `${n < 0 ? '-' : ''}${CURRENCY_SYMBOL} ${formatter.format(Math.abs(n))}`;
}
