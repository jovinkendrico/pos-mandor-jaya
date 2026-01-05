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
     */
    getDiscount1Percent: (item: TItem) => number;

    /**
     * A function that returns the second discount percentage (e.g., 5 for 5%).
     */
    getDiscount2Percent: (item: TItem) => number;

    /**
     * A function that returns the third discount percentage.
     */
    getDiscount3Percent?: (item: TItem) => number;

    /**
     * A function that returns the fourth discount percentage.
     */
    getDiscount4Percent?: (item: TItem) => number;
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
    /** The calculated monetary amount of the third discount. */
    discount3Amount: number;
    /** The calculated monetary amount of the fourth discount. */
    discount4Amount: number;
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
    /** The sum of all third discounts from all items. */
    totalDiscount3Amount: number;
    /** The sum of all fourth discounts from all items. */
    totalDiscount4Amount: number;
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
    const {
        getQuantity,
        getPrice,
        getDiscount1Percent,
        getDiscount2Percent,
        getDiscount3Percent,
        getDiscount4Percent
    } = accessors;

    let subtotal = 0;
    let totalDiscount1Amount = 0;
    let totalDiscount2Amount = 0;
    let totalDiscount3Amount = 0;
    let totalDiscount4Amount = 0;

    // 1. Calculate each item with its sequential discounts
    const itemsCalculated = items.map((item) => {
        const qty = getQuantity(item);
        const price = getPrice(item);
        const disc1Pct = getDiscount1Percent(item);
        const disc2Pct = getDiscount2Percent(item);
        const disc3Pct = getDiscount3Percent ? getDiscount3Percent(item) : 0;
        const disc4Pct = getDiscount4Percent ? getDiscount4Percent(item) : 0;

        const grossAmount = qty * price;

        // Sequential discounts: Disc 1 -> Disc 2 -> Disc 3 -> Disc 4
        const discount1Amount = (grossAmount * disc1Pct) / 100;
        const afterDisc1 = grossAmount - discount1Amount;

        const discount2Amount = (afterDisc1 * disc2Pct) / 100;
        const afterDisc2 = afterDisc1 - discount2Amount;

        const discount3Amount = (afterDisc2 * disc3Pct) / 100;
        const afterDisc3 = afterDisc2 - discount3Amount;

        const discount4Amount = (afterDisc3 * disc4Pct) / 100;
        const netAmount = afterDisc3 - discount4Amount;

        return {
            originalItem: item,
            grossAmount,
            discount1Amount,
            discount2Amount,
            discount3Amount,
            discount4Amount,
            netAmount,
        };
    });

    // 2. Sum all amounts and discounts
    itemsCalculated.forEach((item) => {
        subtotal += item.grossAmount;
        totalDiscount1Amount += item.discount1Amount;
        totalDiscount2Amount += item.discount2Amount;
        totalDiscount3Amount += item.discount3Amount;
        totalDiscount4Amount += item.discount4Amount;
    });

    // 3. Calculate header-level totals
    const totalAfterDiscounts =
        subtotal - totalDiscount1Amount - totalDiscount2Amount - totalDiscount3Amount - totalDiscount4Amount;

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
        totalDiscount3Amount,
        totalDiscount4Amount,
        totalAfterDiscounts,
        ppnAmount,
        grandTotal,
    };
}
