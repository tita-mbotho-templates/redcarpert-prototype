import products from "../data/products.json" with { type: "json" };

/** Prices are integer amounts in ZAR. Null means no verified client price yet. */
export type PriceZar = number | null;
const priceEntries = products.dresses;
if (products.currency !== "ZAR" || priceEntries.length !== 8) {
  throw new Error("products.json: expected eight dress records in ZAR");
}
const ids = new Set<string>();
for (const entry of priceEntries) {
  if (!/^[a-z0-9-]+$/.test(entry.id) || ids.has(entry.id)) {
    throw new Error("products.json: duplicate or invalid dress ID");
  }
  ids.add(entry.id);
  if (entry.priceZar !== null && (!Number.isSafeInteger(entry.priceZar) || entry.priceZar <= 0)) {
    throw new Error("products.json: prices must be positive integer rand amounts or null");
  }
}

export function priceForDress(id: string): PriceZar {
  const record = priceEntries.find(entry => entry.id === id);
  if (!record) throw new Error("products.json: missing price for " + id);
  return record.priceZar;
}

export function displayDressPrice(priceZar: PriceZar): string {
  if (priceZar === null) return "Price to be confirmed";
  if (!Number.isSafeInteger(priceZar) || priceZar <= 0) {
    throw new Error("Invalid wedding dress price");
  }
  return "R " + new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 0 }).format(priceZar);
}
