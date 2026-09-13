export function formatMoney(value: number) {
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
