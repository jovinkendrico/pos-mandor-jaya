import { DatePicker } from '@/components/date-picker';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { ReturnType } from '@/constants/enum';
import usePurchaseReturn from '@/hooks/use-purchase-return';
import { calculateTotals, ItemAccessors } from '@/lib/transaction-calculator';
import { cn, formatCurrency, formatNumber } from '@/lib/utils';
import { index } from '@/routes/purchase-returns';
import { IBank, IPurchase, IPurchaseDetail } from '@/types';
import { router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

interface IPurchaseReturnViewModel extends IPurchaseDetail {
    selected: boolean;
    max_quantity: number;
}

interface PurchaseReturnFormProps {
    purchases: IPurchase[];
    returnedQuantities?: { [key: number]: number };
    banks?: IBank[];
}

const PurchaseReturnForm = (props: PurchaseReturnFormProps) => {
    const { purchases, returnedQuantities = {}, banks = [] } = props;

    const [returnItems, setReturnItems] = useState<IPurchaseReturnViewModel[]>(
        [],
    );
    const [quantityDisplayValues, setQuantityDisplayValues] = useState<
        string[]
    >([]);

    const {
        data: dataPurchaseReturn,
        setData: setDataPurchaseReturn,
        errors: errorsPurchaseReturn,
        processing: processingPurchaseReturn,
        reset: resetPurchaseReturn,

        handleSubmit: handleSubmitPurchaseReturn,
        handleCancel: handleCancelPurchaseReturn,
        handleChangeItem,
        handleQuantityChange,
    } = usePurchaseReturn();

    const selectedPurchase = useMemo(() => {
        if (!dataPurchaseReturn.purchase_id) return undefined;
        const a = purchases.find(
            (p) => p.id === dataPurchaseReturn.purchase_id,
        );
        console.log(a);
        return a;
    }, [dataPurchaseReturn, purchases]);

    const purchaseComboboxOptions: ComboboxOption[] = useMemo(() => {
        return purchases.map((purchase) => ({
            label: purchase.purchase_number,
            value: purchase.id.toString(),
        }));
    }, [purchases]);

    useEffect(() => {
        if (selectedPurchase) {
            const initialReturnItems = selectedPurchase.details.map(
                (detail) => {
                    const returnedQty = returnedQuantities[detail.id || 0] || 0;
                    const originalQuantity = detail.quantity || 0;
                    const remainingQty = originalQuantity - returnedQty;

                    return {
                        ...detail,
                        selected: remainingQty > 0,
                        max_quantity: remainingQty > 0 ? remainingQty : 0,
                        quantity: remainingQty > 0 ? remainingQty : 0,
                    } as IPurchaseReturnViewModel;
                },
            );
            setReturnItems(initialReturnItems);

            setQuantityDisplayValues(
                initialReturnItems.map((item) => item.quantity.toString()),
            );

            setDataPurchaseReturn('details', initialReturnItems);
        } else {
            setReturnItems([]);
            setDataPurchaseReturn('details', []);
            setQuantityDisplayValues([]);
        }
    }, [selectedPurchase, returnedQuantities, setDataPurchaseReturn]);

    const handleToggleItem = (index: number) => {
        const newItems = [...returnItems];
        newItems[index].selected = !newItems[index].selected;
        setReturnItems(newItems);
    };

    const calculations = useMemo(() => {
        const detailAccessors: ItemAccessors<IPurchaseDetail> = {
            getQuantity: (detail) => detail.quantity || 0,
            getPrice: (detail) => detail.price || 0,
            getDiscount1Percent: (detail) => detail.discount1_percent || 0,
            getDiscount2Percent: (detail) => detail.discount2_percent || 0,
        };

        return calculateTotals(
            dataPurchaseReturn.details,
            detailAccessors,
            dataPurchaseReturn.ppn_percent,
        );
    }, [dataPurchaseReturn.details, dataPurchaseReturn.ppn_percent]);

    console.log(selectedPurchase);
    console.log(returnItems);
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                handleSubmitPurchaseReturn();
            }}
            className="space-y-6"
        >
            {/* Header Information */}
            <Card className="content overflow-auto">
                <CardHeader>
                    <CardTitle>Informasi Retur Pembelian</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="purchase_id">
                                Pilih Pembelian{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Combobox
                                options={purchaseComboboxOptions}
                                value={dataPurchaseReturn.purchase_id?.toString()}
                                onValueChange={(value) =>
                                    setDataPurchaseReturn(
                                        'purchase_id',
                                        Number(value),
                                    )
                                }
                                placeholder="Pilih pembelian..."
                                searchPlaceholder="Cari pembelian..."
                                className="combobox"
                                maxDisplayItems={10}
                            />
                            <InputError
                                message={errorsPurchaseReturn.purchase_id}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="return_date">
                                Tanggal Retur{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <DatePicker
                                value={dataPurchaseReturn.return_date}
                                onChange={(value) =>
                                    setDataPurchaseReturn(
                                        'return_date',
                                        value as Date,
                                    )
                                }
                                className="input-box"
                            />
                            <InputError
                                message={errorsPurchaseReturn.return_date}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="return_type">
                                Tipe Retur{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={dataPurchaseReturn.return_type}
                                onValueChange={(value) => {
                                    setDataPurchaseReturn('return_type', value);
                                    if (value === ReturnType.STOCK_ONLY) {
                                        setDataPurchaseReturn(
                                            'refund_bank_id',
                                            0,
                                        );
                                    }
                                }}
                            >
                                <SelectTrigger className="combobox">
                                    <SelectValue placeholder="Pilih tipe retur" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="stock_only">
                                        Retur Stok Saja
                                    </SelectItem>
                                    <SelectItem value="stock_and_refund">
                                        Retur Stok + Refund (Potong
                                        Hutang/Terima Uang)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError
                                message={errorsPurchaseReturn.return_type}
                            />
                        </div>

                        {dataPurchaseReturn.return_type ===
                            ReturnType.STOCK_AND_REFUND && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="refund_method">
                                        Metode Refund{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={dataPurchaseReturn.refund_method}
                                        onValueChange={(value) => {
                                            setDataPurchaseReturn(
                                                'refund_method',
                                                value,
                                            );
                                            if (value === 'reduce_payable') {
                                                setDataPurchaseReturn(
                                                    'refund_bank_id',
                                                    0,
                                                );
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="combobox">
                                            <SelectValue placeholder="Pilih metode refund" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="reduce_payable">
                                                Kurangi Hutang (Otomatis)
                                            </SelectItem>
                                            <SelectItem value="cash_refund">
                                                Terima Uang (Cash Refund via
                                                Bank)
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={
                                            errorsPurchaseReturn.refund_method
                                        }
                                    />
                                </div>

                                {dataPurchaseReturn.refund_method ===
                                    'cash_refund' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="refund_bank_id">
                                            Bank untuk Refund{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            value={
                                                dataPurchaseReturn.refund_bank_id.toString() ||
                                                undefined
                                            }
                                            onValueChange={(value) => {
                                                setDataPurchaseReturn(
                                                    'refund_bank_id',
                                                    Number(value),
                                                );
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih bank" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {banks &&
                                                    banks.length > 0 &&
                                                    banks.map((bank) => (
                                                        <SelectItem
                                                            key={bank.id}
                                                            value={bank.id.toString()}
                                                        >
                                                            {bank.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={
                                                errorsPurchaseReturn.refund_bank_id
                                            }
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Items Selection Table */}
            {dataPurchaseReturn.purchase_id && (
                <Card className="content">
                    <CardHeader>
                        <CardTitle>Pilih Barang yang akan Diretur</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="input-box overflow-x-auto rounded-lg">
                            <Table className="content">
                                <TableHeader>
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableHead className="w-[50px]">
                                            Pilih
                                        </TableHead>
                                        <TableHead className="w-[100px] text-center">
                                            Kode
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Nama Item
                                        </TableHead>
                                        <TableHead>UOM</TableHead>
                                        <TableHead className="text-center">
                                            Qty Awal
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Qty Retur
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Harga
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Disc 1
                                        </TableHead>
                                        <TableHead className="text-center">
                                            Disc 2
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {returnItems.map((item, index) => {
                                        const detail =
                                            selectedPurchase?.details[index];
                                        const originalQuantity = formatNumber(
                                            detail?.quantity ?? 0,
                                        );
                                        const returnedQty =
                                            returnedQuantities[
                                                detail?.id || 0
                                            ] || 0;
                                        const remainingQty =
                                            originalQuantity - returnedQty;
                                        const isFullyReturned =
                                            remainingQty <= 0;

                                        return (
                                            <TableRow
                                                key={index}
                                                className={cn(
                                                    'dark:border-b-2 dark:border-white/25',
                                                    isFullyReturned
                                                        ? 'opacity-50'
                                                        : '',
                                                )}
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={item.selected}
                                                        onCheckedChange={() =>
                                                            !isFullyReturned &&
                                                            handleToggleItem(
                                                                index,
                                                            )
                                                        }
                                                        disabled={
                                                            isFullyReturned
                                                        }
                                                        className="cursor-pointer"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center font-mono">
                                                    {detail?.item?.code}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {detail?.item?.name}
                                                    {isFullyReturned ? (
                                                        <Badge className="badge-green-light">
                                                            Sudah direfund
                                                            sepenuhnya
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="secondary"
                                                            className="badge-blue-light"
                                                        >
                                                            Sudah direfund:{' '}
                                                            {formatNumber(
                                                                returnedQty,
                                                            )}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {
                                                            detail?.item_uom
                                                                ?.uom.name
                                                        }
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div>
                                                        <div>
                                                            {formatNumber(
                                                                item.max_quantity ??
                                                                    0,
                                                            ).toLocaleString(
                                                                'id-ID',
                                                            )}
                                                        </div>
                                                        {returnedQty > 0 && (
                                                            <div className="text-xs text-muted-foreground">
                                                                dari{' '}
                                                                {originalQuantity.toLocaleString(
                                                                    'id-ID',
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0.01"
                                                        max={
                                                            item.max_quantity ??
                                                            0
                                                        }
                                                        value={item.quantity}
                                                        onChange={(e) =>
                                                            handleQuantityChange(
                                                                index,
                                                                e,
                                                                quantityDisplayValues,
                                                                setQuantityDisplayValues,
                                                            )
                                                        }
                                                        className="w-24 text-right"
                                                        disabled={
                                                            !item.selected ||
                                                            isFullyReturned
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {formatCurrency(
                                                        formatNumber(
                                                            item.price,
                                                        ),
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right text-red-600">
                                                    {formatNumber(
                                                        item.discount1_percent ??
                                                            0,
                                                    ) > 0
                                                        ? `${item.discount1_percent}%`
                                                        : '-'}
                                                </TableCell>
                                                <TableCell className="text-right text-red-600">
                                                    {formatNumber(
                                                        item.discount2_percent ??
                                                            0,
                                                    ) > 0
                                                        ? `${item.discount2_percent}%`
                                                        : '-'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Totals & Footer */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Alasan Retur</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Alasan</Label>
                            <Textarea
                                id="reason"
                                value={dataPurchaseReturn.reason}
                                onChange={(e) => {
                                    setDataPurchaseReturn(
                                        'reason',
                                        e.target.value,
                                    );
                                }}
                                rows={4}
                                placeholder="Alasan retur (optional)"
                            />
                        </div>
                        <div className="space-y-2 border-t pt-2">
                            <div className="text-sm text-muted-foreground">
                                💡 <strong>Info:</strong> Pilih items yang akan
                                diretur dan atur quantity-nya
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Total Retur</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                Subtotal (sebelum diskon):
                            </span>
                            <span className="font-medium">
                                {formatCurrency(calculations.subtotal)}
                            </span>
                        </div>
                        {calculations.totalDiscount1Amount > 0 && (
                            <div className="flex justify-between text-sm text-red-600">
                                <span>Total Diskon 1:</span>
                                <span>
                                    -
                                    {formatCurrency(
                                        calculations.totalDiscount1Amount,
                                    )}
                                </span>
                            </div>
                        )}
                        {calculations.totalDiscount2Amount > 0 && (
                            <div className="flex justify-between text-sm text-red-600">
                                <span>Total Diskon 2:</span>
                                <span>
                                    -
                                    {formatCurrency(
                                        calculations.totalDiscount2Amount,
                                    )}
                                </span>
                            </div>
                        )}
                        {calculations.ppnAmount > 0 && (
                            <div className="flex justify-between text-sm text-blue-600">
                                <span>
                                    PPN ({dataPurchaseReturn.ppn_percent}%):
                                </span>
                                <span>
                                    +{formatCurrency(calculations.ppnAmount)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between border-t pt-3 text-lg font-bold">
                            <span>TOTAL RETUR:</span>
                            <span className="text-primary">
                                {formatCurrency(calculations.grandTotal)}
                            </span>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.visit(index().url)}
                                disabled={processingPurchaseReturn}
                                className="flex-1"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    processingPurchaseReturn ||
                                    !dataPurchaseReturn
                                }
                                className="flex-1"
                            >
                                {processingPurchaseReturn
                                    ? 'Menyimpan...'
                                    : 'Simpan Retur'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </form>
    );
};

export default PurchaseReturnForm;
