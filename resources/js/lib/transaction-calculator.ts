/**
 * Defines the shape of the accessor functions required to extract
 * calculation data from a generic item.
 */
export interface ItemAccessors<TItem> {
    getQuantity: (item: TItem) => number;
    getPrice: (item: TItem) => number;
    getDiscount1Percent: (item: TItem) => number;
    getDiscount2Percent: (item: TItem) => number;
    getDiscount3Percent?: (item: TItem) => number;
    getDiscount4Percent?: (item: TItem) => number;
    getPphPercent?: (item: TItem) => number;
    getBiayaPksPerQty?: (item: TItem) => number;
}

export interface CalculatedItemDetails<TItem> {
    originalItem: TItem;
    grossAmount: number;
    discount1Amount: number;
    discount2Amount: number;
    discount3Amount: number;
    discount4Amount: number;
    netAmount: number;
    pphAmount: number;
    biayaPksAmount: number;
    finalItemAmount: number;
}

export interface CalculationResult<TItem> {
    items: CalculatedItemDetails<TItem>[];
    subtotal: number;
    totalDiscount1Amount: number;
    totalDiscount2Amount: number;
    totalDiscount3Amount: number;
    totalDiscount4Amount: number;
    totalAfterDiscounts: number;
    ppnAmount: number;
    totalPphAmount: number;
    totalBiayaPksAmount: number;
    grandTotal: number;
}

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
        getDiscount4Percent,
        getPphPercent,
        getBiayaPksPerQty
    } = accessors;

    let subtotal = 0;
    let totalDiscount1Amount = 0;
    let totalDiscount2Amount = 0;
    let totalDiscount3Amount = 0;
    let totalDiscount4Amount = 0;
    let totalPphAmount = 0;
    let totalBiayaPksAmount = 0;

    const itemsCalculated = items.map((item) => {
        const qty = getQuantity(item);
        const price = getPrice(item);
        const disc1Pct = getDiscount1Percent(item);
        const disc2Pct = getDiscount2Percent(item);
        const disc3Pct = getDiscount3Percent ? getDiscount3Percent(item) : 0;
        const disc4Pct = getDiscount4Percent ? getDiscount4Percent(item) : 0;
        const pphPct = getPphPercent ? getPphPercent(item) : 0;
        const biayaPksPerQty = getBiayaPksPerQty ? getBiayaPksPerQty(item) : 0;

        const grossAmount = qty * price;

        const discount1Amount = (grossAmount * disc1Pct) / 100;
        const afterDisc1 = grossAmount - discount1Amount;

        const discount2Amount = (afterDisc1 * disc2Pct) / 100;
        const afterDisc2 = afterDisc1 - discount2Amount;

        const discount3Amount = (afterDisc2 * disc3Pct) / 100;
        const afterDisc3 = afterDisc2 - discount3Amount;

        const discount4Amount = (afterDisc3 * disc4Pct) / 100;
        const netAmount = afterDisc3 - discount4Amount;

        // PPh usually calculated from net amount after all item discounts
        const pphAmount = (netAmount * pphPct) / 100;
        const biayaPksAmount = qty * biayaPksPerQty;
        const finalItemAmount = netAmount - pphAmount - biayaPksAmount;

        return {
            originalItem: item,
            grossAmount,
            discount1Amount,
            discount2Amount,
            discount3Amount,
            discount4Amount,
            netAmount,
            pphAmount,
            biayaPksAmount,
            finalItemAmount,
        };
    });

    itemsCalculated.forEach((item) => {
        subtotal += item.grossAmount;
        totalDiscount1Amount += item.discount1Amount;
        totalDiscount2Amount += item.discount2Amount;
        totalDiscount3Amount += item.discount3Amount;
        totalDiscount4Amount += item.discount4Amount;
        totalPphAmount += item.pphAmount;
        totalBiayaPksAmount += item.biayaPksAmount;
    });

    const totalAfterDiscounts =
        subtotal - totalDiscount1Amount - totalDiscount2Amount - totalDiscount3Amount - totalDiscount4Amount;

    const ppnPct =
        (typeof ppnPercent === 'string'
            ? parseFloat(ppnPercent)
            : ppnPercent) || 0;
    const ppnAmount = (totalAfterDiscounts * ppnPct) / 100;

    const grandTotal = totalAfterDiscounts + ppnAmount - totalPphAmount - totalBiayaPksAmount;

    return {
        items: itemsCalculated,
        subtotal,
        totalDiscount1Amount,
        totalDiscount2Amount,
        totalDiscount3Amount,
        totalDiscount4Amount,
        totalAfterDiscounts,
        ppnAmount,
        totalPphAmount,
        totalBiayaPksAmount,
        grandTotal,
    };
}
