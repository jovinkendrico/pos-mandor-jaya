/**
 * Defines the shape of the accessor functions required to extract
 * calculation data from a generic item.
 */
export interface ItemAccessors<TItem> {
    /**
     * A function that returns the quantity for a given item.
     * Should handle any parsing (e.g., parseFloat) and return 0 for invalid values.
     */
    getQuantity: (item: TItem) => number;

    /**
     * A function that returns the base price for a given item.
     * Should handle any parsing and return 0 for invalid values.
     */
    getPrice: (item: TItem) => number;

    /**
     * A function that returns the first discount percentage (e.g., 10 for 10%).
     * Should handle any parsing and return 0 for invalid values.
     */
    getDiscount1Percent: (item: TItem) => number;

    /**
     * A function that returns the second discount percentage (e.g., 5 for 5%).
     * Should handle any parsing and return 0 for invalid values.
     */
    getDiscount2Percent: (item: TItem) => number;
}

/**
 * The calculated financial details for a single item.
 */
export interface CalculatedItemDetails<TItem> {
    /** The original item object. */
    originalItem: TItem;
    /** The gross amount before any discounts (qty * price). */
    grossAmount: number;
    /** The calculated monetary amount of the first discount. */
    discount1Amount: number;
    /** The calculated monetary amount of the second discount (applied sequentially). */
    discount2Amount: number;
    /** The final net amount for the item after all discounts. */
    netAmount: number;
}

/**
 * The complete set of calculations for the entire list of items.
 */
export interface CalculationResult<TItem> {
    /** An array of calculated details for each item. */
    items: CalculatedItemDetails<TItem>[];
    /** The sum of all item gross amounts (before any discounts). */
    subtotal: number;
    /** The sum of all first discounts from all items. */
    totalDiscount1Amount: number;
    /** The sum of all second discounts from all items. */
    totalDiscount2Amount: number;
    /** The final total after all discounts are subtracted from the subtotal. */
    totalAfterDiscounts: number;
    /** The calculated PPN (tax) amount. */
    ppnAmount: number;
    /** The final grand total (totalAfterDiscounts + ppnAmount). */
    grandTotal: number;
}

/**
 * Calculates subtotals, discounts, PPN, and grand total for a list of items
 * in a generic, type-safe way.
 *
 * @param items - An array of items of any type TItem.
 * @param accessors - An object containing functions to extract numerical values from an item.
 * @param ppnPercent - The PPN (tax) percentage to apply (e.g., 11 for 11%).
 * @returns A CalculationResult object with all computed totals.
 */
export function calculateTotals<TItem>(
    items: TItem[],
    accessors: ItemAccessors<TItem>,
    ppnPercent: number | string,
): CalculationResult<TItem> {
    const { getQuantity, getPrice, getDiscount1Percent, getDiscount2Percent } =
        accessors;

    let subtotal = 0;
    let totalDiscount1Amount = 0;
    let totalDiscount2Amount = 0;

    // 1. Calculate each item with its sequential discounts
    const itemsCalculated = items.map((item) => {
        const qty = getQuantity(item);
        const price = getPrice(item);
        const disc1Pct = getDiscount1Percent(item);
        const disc2Pct = getDiscount2Percent(item);

        const grossAmount = qty * price;
        const discount1Amount = (grossAmount * disc1Pct) / 100;
        const afterDisc1 = grossAmount - discount1Amount;
        const discount2Amount = (afterDisc1 * disc2Pct) / 100;
        const netAmount = afterDisc1 - discount2Amount;

        return {
            originalItem: item,
            grossAmount,
            discount1Amount,
            discount2Amount,
            netAmount,
        };
    });

    // 2. Sum all amounts and discounts
    itemsCalculated.forEach((item) => {
        subtotal += item.grossAmount;
        totalDiscount1Amount += item.discount1Amount;
        totalDiscount2Amount += item.discount2Amount;
    });

    // 3. Calculate header-level totals
    // Your original logic summed the individual item discounts, which is correct.
    const totalAfterDiscounts =
        subtotal - totalDiscount1Amount - totalDiscount2Amount;

    // 4. PPN (Tax)
    const ppnPct =
        (typeof ppnPercent === 'string'
            ? parseFloat(ppnPercent)
            : ppnPercent) || 0;
    const ppnAmount = (totalAfterDiscounts * ppnPct) / 100;

    // 5. Grand Total
    const grandTotal = totalAfterDiscounts + ppnAmount;

    return {
        items: itemsCalculated,
        subtotal,
        totalDiscount1Amount,
        totalDiscount2Amount,
        totalAfterDiscounts,
        ppnAmount,
        grandTotal,
    };
}

// --- --- --- --- --- --- --- --- --- ---
// --- --- ---  HOW TO USE IT  --- --- ---
// --- --- --- --- --- --- --- --- --- ---

/*
// Assuming you have your types
interface PurchaseDetail {
  id: number;
  quantity: string;
  price: string;
  discount1_percent: string;
  discount2_percent: string;
  // ...other properties
}

interface FormData {
  details: PurchaseDetail[];
  ppn_percent: string;
  // ...other properties
}

// And your component data
// const form = { data: { ... } }; // From your useMemo example

// 1. Define your accessors to match your data structure.
// This is where you put your parseFloat logic.
const detailAccessors: ItemAccessors<PurchaseDetail> = {
  getQuantity: (detail) => parseFloat(detail.quantity) || 0,
  getPrice: (detail) => parseFloat(detail.price) || 0,
  getDiscount1Percent: (detail) => parseFloat(detail.discount1_percent) || 0,
  getDiscount2Percent: (detail) => parseFloat(detail.discount2_percent) || 0,
};

// 2. You can now use this inside your useMemo hook (or anywhere else)
const calculations = useMemo(() => {
  return calculateTotals(
    form.data.details,
    detailAccessors,
    form.data.ppn_percent
  );
}, [form.data.details, form.data.ppn_percent]);

// 3. You can access the results just as before
// console.log(calculations.grandTotal);
// console.log(calculations.items[0].netAmount);

*/
