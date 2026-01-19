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
import useSaleReturn from '@/hooks/use-sale-return';
import { calculateTotals, ItemAccessors } from '@/lib/transaction-calculator';
import {
    cn,
    formatCurrency,
    formatNumber,
    formatNumberWithSeparator,
} from '@/lib/utils';
import { IBank, IItem, ISale, ISaleDetail } from '@/types';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface ISaleReturnViewModel extends ISaleDetail {
    selected: boolean;
    max_quantity: number;
    sale_detail_id?: number;
}

interface SaleReturnFormProps {
    sales: ISale[];
    returnedQuantities?: { [key: number]: number };
    banks?: IBank[];
}

const SaleReturnForm = (props: SaleReturnFormProps) => {
    const { sales, returnedQuantities = {}, banks = [] } = props;

    const [returnItems, setReturnItems] = useState<ISaleReturnViewModel[]>([]);
    const [quantityDisplayValues, setQuantityDisplayValues] = useState<
        string[]
    >([]);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const {
        data: dataSaleReturn,
        setData: setDataSaleReturn,
        errors: errorsSaleReturn,
        processing: processingSaleReturn,

        handleSubmit: handleSubmitSaleReturn,
        handleCancel: handleCancelSaleReturn,
        handleQuantityChange,
    } = useSaleReturn();

    const saleComboboxOptions: ComboboxOption[] = useMemo(() => {
        return sales.map((sale) => ({
            label: `${sale.sale_number} - ${sale.customer?.name}`,
            value: sale.id.toString(),
        }));
    }, [sales]);

    useEffect(() => {
        const fetchSaleDetails = async () => {
            if (!dataSaleReturn.sale_id) {
                setReturnItems([]);
                setDataSaleReturn('details', []);
                setQuantityDisplayValues([]);
                setDataSaleReturn('ppn_percent', 0);
                return;
            }

            setIsLoadingDetails(true);
            try {
                const response = await axios.get(
                    `/sale-returns/sale-details/${dataSaleReturn.sale_id}`
                );
                const { sale, returnedQuantities: fetchedReturnedQuantities } =
                    response.data;

                const initialReturnItems = sale.details.map(
                    (detail: ISaleDetail) => {
                        const returnedQty =
                            fetchedReturnedQuantities[detail.id || 0] || 0;
                        const originalQuantity = detail.quantity || 0;
                        const remainingQty = originalQuantity - returnedQty;

                        return {
                            ...detail,
                            selected: remainingQty > 0,
                            max_quantity: remainingQty > 0 ? remainingQty : 0,
                            quantity: remainingQty > 0 ? remainingQty : 0,
                            sale_detail_id: detail.id,
                        } as ISaleReturnViewModel;
                    }
                );

                setReturnItems(initialReturnItems);
                setQuantityDisplayValues(
                    initialReturnItems.map((item: ISaleReturnViewModel) =>
                        item.quantity.toString()
                    )
                );

                setDataSaleReturn('details', initialReturnItems);
                setDataSaleReturn('ppn_percent', sale.ppn_percent || 0);
            } catch (error) {
                console.error('Error fetching sale details:', error);
            } finally {
                setIsLoadingDetails(false);
            }
        };

        fetchSaleDetails();
    }, [dataSaleReturn.sale_id, setDataSaleReturn]);

    const handleToggleItem = (index: number) => {
        const newItems = [...returnItems];
        newItems[index].selected = !newItems[index].selected;
        setReturnItems(newItems);
    };

    const calculations = useMemo(() => {
        const detailAccessors: ItemAccessors<ISaleDetail> = {
            getQuantity: (detail) => detail.quantity || 0,
            getPrice: (detail) => detail.price || 0,
            getDiscount1Percent: (detail) => detail.discount1_percent || 0,
            getDiscount2Percent: (detail) => detail.discount2_percent || 0,
        };

        return calculateTotals(
            dataSaleReturn.details,
            detailAccessors,
            dataSaleReturn.ppn_percent,
        );
    }, [dataSaleReturn.details, dataSaleReturn.ppn_percent]);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                handleSubmitSaleReturn();
            }}
            className="space-y-6"
        >
            {/* Header Information */}
            <Card className="content overflow-auto">
                <CardHeader>
                    <CardTitle>Informasi Retur Penjualan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="sale_id">
                                Pilih Penjualan{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Combobox
                                options={saleComboboxOptions}
                                value={dataSaleReturn.sale_id?.toString()}
                                onValueChange={(value) =>
                                    setDataSaleReturn('sale_id', Number(value))
                                }
                                placeholder="Pilih penjualan..."
                                searchPlaceholder="Cari penjualan..."
                                className="combobox"
                                maxDisplayItems={10}
                            />
                            <InputError message={errorsSaleReturn.sale_id} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="return_date">
                                Tanggal Retur{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <DatePicker
                                value={dataSaleReturn.return_date}
                                onChange={(value) =>
                                    setDataSaleReturn(
                                        'return_date',
                                        value as Date,
                                    )
                                }
                                className="input-box"
                            />
                            <InputError
                                message={errorsSaleReturn.return_date}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="return_type">
                                Tipe Retur{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={dataSaleReturn.return_type}
                                onValueChange={(value) => {
                                    const type =
                                        value === ReturnType.STOCK_ONLY
                                            ? ReturnType.STOCK_ONLY
                                            : ReturnType.STOCK_AND_REFUND;
                                    setDataSaleReturn('return_type', type);

                                    // Reset refund method when changing type
                                    if (type === ReturnType.STOCK_ONLY) {
                                        setDataSaleReturn(
                                            'refund_method',
                                            null,
                                        );
                                        setDataSaleReturn(
                                            'refund_bank_id',
                                            null,
                                        );
                                    } else {
                                        setDataSaleReturn(
                                            'refund_method',
                                            RefundMethod.REDUCE_RECEIVABLE,
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
                                        Piutang/Kembalikan Uang)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError
                                message={errorsSaleReturn.return_type}
                            />
                        </div>

                        {dataSaleReturn.return_type ===
                            ReturnType.STOCK_AND_REFUND && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="refund_method">
                                            Metode Refund{' '}
                                            <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={
                                                dataSaleReturn.refund_method ??
                                                undefined
                                            }
                                            onValueChange={(value) => {
                                                const method =
                                                    value ===
                                                        RefundMethod.CASH_REFUND
                                                        ? RefundMethod.CASH_REFUND
                                                        : RefundMethod.REDUCE_RECEIVABLE;
                                                setDataSaleReturn(
                                                    'refund_bank_id',
                                                    null,
                                                );
                                                setDataSaleReturn(
                                                    'refund_method',
                                                    method,
                                                );
                                            }}
                                        >
                                            <SelectTrigger className="combobox">
                                                <SelectValue placeholder="Pilih metode refund" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="reduce_receivable">
                                                    Kurangi Piutang (Otomatis)
                                                </SelectItem>
                                                <SelectItem value="cash_refund">
                                                    Kembalikan Uang (Cash Refund via
                                                    Bank)
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={errorsSaleReturn.refund_method}
                                        />
                                    </div>

                                    {dataSaleReturn.refund_method ===
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
                                                        dataSaleReturn.refund_bank_id?.toString() ||
                                                        undefined
                                                    }
                                                    onValueChange={(value) => {
                                                        setDataSaleReturn(
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
                                                        errorsSaleReturn.refund_bank_id
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
            {dataSaleReturn.sale_id && (
                <Card className="content">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Pilih Barang yang akan Diretur</CardTitle>
                            {isLoadingDetails && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading details...
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingDetails ? (
                            <div className="flex h-32 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
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
                                            const originalQuantity = formatNumber(
                                                item.max_quantity +
                                                (returnedQuantities[
                                                    item.sale_detail_id || 0
                                                ] || 0)
                                            );
                                            const returnedQty =
                                                returnedQuantities[
                                                item.sale_detail_id || 0
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
                                                        {item.item?.code}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div>{item.item?.name}</div>
                                                        {item.item && (
                                                            <div className="mt-1 flex flex-wrap justify-center gap-2 text-[10px] text-muted-foreground">
                                                                <span title="Stok Fisik">
                                                                    Stok:{' '}
                                                                    {formatNumberWithSeparator(
                                                                        item.item?.stock || 0
                                                                    )}
                                                                </span>
                                                                <span
                                                                    className="text-orange-500"
                                                                    title="Stok Tertahan (Pending)"
                                                                >
                                                                    Hold:{' '}
                                                                    {formatNumberWithSeparator(
                                                                        item.item?.pending_stock ??
                                                                        0,
                                                                    )}
                                                                </span>
                                                                <span
                                                                    className={
                                                                        item.item?.available_stock !== undefined &&
                                                                            item.item.available_stock <
                                                                            0
                                                                            ? 'font-bold text-red-500'
                                                                            : 'font-bold text-green-600'
                                                                    }
                                                                    title="Stok Tersedia"
                                                                >
                                                                    Sisa:{' '}
                                                                    {formatNumberWithSeparator(
                                                                        item.item?.available_stock ??
                                                                        (item.item?.stock || 0)
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
                                                                {formatNumber(
                                                                    returnedQty,
                                                                )}
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline">
                                                            {
                                                                item.item_uom
                                                                    ?.uom.name
                                                            }
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
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
                        )}
                    </CardContent>
                </Card>
            )}

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
                                value={dataSaleReturn.reason}
                                onChange={(e) => {
                                    setDataSaleReturn('reason', e.target.value);
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
                                    PPN ({dataSaleReturn.ppn_percent}%):
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
                                onClick={handleCancelSaleReturn}
                                disabled={processingSaleReturn}
                                className="btn-secondary flex-1"
                            >
                                Reset
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    processingSaleReturn ||
                                    !dataSaleReturn.sale_id
                                }
                                className="btn-primary flex-1"
                            >
                                {processingSaleReturn
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

export default SaleReturnForm;
