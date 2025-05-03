export function formatCurrency(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency === "IDR" ? "IDR" : "USD",
    minimumFractionDigits: currency === "IDR" ? 0 : 2,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  });

  return formatter.format(amount);
}
