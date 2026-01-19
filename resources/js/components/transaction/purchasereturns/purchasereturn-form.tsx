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
import { RefundMethod, ReturnType } from '@/constants/enum';
import usePurchaseReturn from '@/hooks/use-purchase-return';
import { calculateTotals, ItemAccessors } from '@/lib/transaction-calculator';
import {
    cn,
    formatCurrency,
    formatNumber,
    formatNumberWithSeparator,
} from '@/lib/utils';
import { IBank, IItem, IPurchase, IPurchaseDetail } from '@/types';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
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
    const { purchases, banks = [] } = props;

    const [returnItems, setReturnItems] = useState<IPurchaseReturnViewModel[]>(
        [],
    );
    const [quantityDisplayValues, setQuantityDisplayValues] = useState<
        string[]
    >([]);

    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [localSelectedPurchase, setLocalSelectedPurchase] = useState<
        IPurchase | undefined
    >(undefined);
    const [localReturnedQuantities, setLocalReturnedQuantities] = useState<
        Record<number, number>
    >({});

    const {
        data: dataPurchaseReturn,
        setData: setDataPurchaseReturn,
        errors: errorsPurchaseReturn,
        processing: processingPurchaseReturn,

        handleSubmit: handleSubmitPurchaseReturn,
        handleCancel: handleCancelPurchaseReturn,
        handleQuantityChange,
    } = usePurchaseReturn();

    const purchaseComboboxOptions: ComboboxOption[] = useMemo(() => {
        return purchases.map((purchase) => ({
            label: purchase.purchase_number,
            value: purchase.id.toString(),
        }));
    }, [purchases]);

    useEffect(() => {
        const fetchPurchaseDetails = async () => {
            if (!dataPurchaseReturn.purchase_id) {
                setLocalSelectedPurchase(undefined);
                setLocalReturnedQuantities({});
                setReturnItems([]);
                setDataPurchaseReturn('details', []);
                setQuantityDisplayValues([]);
                return;
            }

            setIsLoadingDetails(true);
            try {
                const response = await axios.get(
                    `/purchase-returns/purchase-details/${dataPurchaseReturn.purchase_id}`,
                );
                const { purchase, returnedQuantities } = response.data;

                setLocalSelectedPurchase(purchase);
                setLocalReturnedQuantities(returnedQuantities);

                const initialReturnItems = purchase.details.map(
                    (detail: IPurchaseDetail) => {
                        const returnedQty =
                            returnedQuantities[detail.id || 0] || 0;
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
                    initialReturnItems.map((item: IPurchaseReturnViewModel) =>
                        item.quantity.toString(),
                    ),
                );

                setDataPurchaseReturn('details', initialReturnItems);
            } catch (error) {
                console.error('Error fetching purchase details:', error);
            } finally {
                setIsLoadingDetails(false);
            }
        };

        fetchPurchaseDetails();
    }, [dataPurchaseReturn.purchase_id, setDataPurchaseReturn]);

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
                                    const type =
                                        value === ReturnType.STOCK_ONLY
                                            ? ReturnType.STOCK_ONLY
                                            : ReturnType.STOCK_AND_REFUND;
                                    setDataPurchaseReturn('return_type', type);

                                    if (type === ReturnType.STOCK_ONLY) {
                                        setDataPurchaseReturn(
                                            'refund_method',
                                            null,
                                        );
                                        setDataPurchaseReturn(
                                            'refund_bank_id',
                                            null,
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
                                            value={
                                                dataPurchaseReturn.refund_method ??
                                                undefined
                                            }
                                            onValueChange={(value) => {
                                                const method =
                                                    value ===
                                                        RefundMethod.CASH_REFUND
                                                        ? RefundMethod.CASH_REFUND
                                                        : RefundMethod.REDUCE_PAYABLE;
                                                setDataPurchaseReturn(
                                                    'refund_bank_id',
                                                    null,
                                                );
                                                setDataPurchaseReturn(
                                                    'refund_method',
                                                    method,
                                                );
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
                                                        dataPurchaseReturn.refund_bank_id?.toString() ||
                                                        undefined
                                                    }
                                                    onValueChange={(value) => {
                                                        setDataPurchaseReturn(
                                                            'refund_bank_id',
                                                            Number(value),
                                                        );
                                                    }}
                                                >
                                                    <SelectTrigger className="combobox">
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
                        <CardTitle className="flex items-center gap-2">
                            Pilih Barang yang akan Diretur
                            {isLoadingDetails && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                        {isLoadingDetails && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}
                        <div className="input-box overflow-x-auto rounded-lg">
                            <Table className="content">
                                <TableHeader>
                                    <TableRow className="dark:border-b-2 dark:border-white/25">
                                        <TableHead className="w-[50px] text-center">
                                            Pilih
                                        </TableHead>
                                        <TableHead className="min-w-[100px] text-center">
                                            Kode
                                        </TableHead>
                                        <TableHead className="min-w-[100px] text-center">
                                            Nama Item
                                        </TableHead>
                                        <TableHead className="min-w-[100px] text-center">
                                            Kondisi Retur
                                        </TableHead>
                                        <TableHead className="min-w-[100px] text-center">
                                            UOM
                                        </TableHead>
                                        <TableHead className="min-w-[100px] text-center">
                                            Qty Awal
                                        </TableHead>
                                        <TableHead className="min-w-[90px] text-center">
                                            Qty Retur
                                        </TableHead>
                                        <TableHead className="min-w-[100px] text-center">
                                            Harga
                                        </TableHead>
                                        <TableHead className="min-w-[100px] text-center">
                                            Disc 1
                                        </TableHead>
                                        <TableHead className="min-w-[100px] text-center">
                                            Disc 2
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {returnItems.map((item, index) => {
                                        const detail =
                                            localSelectedPurchase?.details[index];
                                        const originalQuantity =
                                            detail?.quantity ?? 0;
                                        const returnedQty =
                                            localReturnedQuantities[
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
                                                <TableCell className="text-center">
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
                                                        className="cursor-pointer dark:border-white"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center font-mono">
                                                    {detail?.item?.code}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div>{detail?.item?.name}</div>
                                                    {detail?.item && (
                                                        <div className="mt-1 flex flex-wrap justify-center gap-2 text-[10px] text-muted-foreground">
                                                            <span title="Stok Fisik">
                                                                Stok:{' '}
                                                                {formatNumberWithSeparator(
                                                                    detail.item.stock,
                                                                )}
                                                            </span>
                                                            <span
                                                                className="text-orange-500"
                                                                title="Stok Tertahan (Pending)"
                                                            >
                                                                Hold:{' '}
                                                                {formatNumberWithSeparator(
                                                                    detail.item.pending_stock ??
                                                                    0,
                                                                )}
                                                            </span>
                                                            <span
                                                                className={
                                                                    detail.item
                                                                        .available_stock &&
                                                                        detail.item
                                                                            .available_stock <
                                                                        0
                                                                        ? 'font-bold text-red-500'
                                                                        : 'font-bold text-green-600'
                                                                }
                                                                title="Stok Tersedia"
                                                            >
                                                                Sisa:{' '}
                                                                {formatNumberWithSeparator(
                                                                    detail.item
                                                                        .available_stock ??
                                                                    detail.item
                                                                        .stock,
                                                                )}
                                                            </span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {isFullyReturned ? (
                                                        <Badge className="badge-green-light">
                                                            Sudah diretur
                                                            sepenuhnya
                                                        </Badge>
                                                    ) : (
                                                        <Badge
                                                            variant="secondary"
                                                            className="badge-yellow-light"
                                                        >
                                                            Sudah diretur:{' '}
                                                            {returnedQty.toLocaleString(
                                                                'id-ID',
                                                            )}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline">
                                                        {
                                                            detail?.item_uom
                                                                ?.uom.name
                                                        }
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div>
                                                        <div>
                                                            {(
                                                                item.max_quantity ??
                                                                0
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
                                                <TableCell className="text-center">
                                                    <Input
                                                        type="text"
                                                        value={item.quantity}
                                                        onChange={(e) =>
                                                            handleQuantityChange(
                                                                index,
                                                                e,
                                                                quantityDisplayValues,
                                                                setQuantityDisplayValues,
                                                            )
                                                        }
                                                        className="input-box w-24 text-center"
                                                        disabled={
                                                            !item.selected ||
                                                            isFullyReturned
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {formatCurrency(
                                                        formatNumber(
                                                            item.price,
                                                        ),
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center text-red-600 dark:text-danger-500">
                                                    {formatNumber(
                                                        item.discount1_percent ??
                                                        0,
                                                    ) > 0
                                                        ? `${item.discount1_percent}%`
                                                        : '-'}
                                                </TableCell>
                                                <TableCell className="text-center text-red-600 dark:text-danger-500">
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
            )
            }

            {/* Totals & Footer */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="content">
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
                                className="input-box"
                            />
                        </div>
                        <div className="space-y-2 border-t pt-2">
                            <div className="text-sm text-muted-foreground">
                                💡 <strong>Info:</strong> Pilih barang yang akan
                                diretur dan atur kuantitasnya
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="content">
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
                                variant="secondary"
                                onClick={handleCancelPurchaseReturn}
                                disabled={processingPurchaseReturn}
                                className="btn-secondary flex-1"
                            >
                                Reset
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    processingPurchaseReturn ||
                                    !dataPurchaseReturn.purchase_id
                                }
                                className="btn-primary flex-1"
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
