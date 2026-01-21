import { DatePicker } from '@/components/date-picker';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { PaymentMethod, PurchasePaymentStatus } from '@/constants/enum';
import usePurchasePayments from '@/hooks/use-purchase-payment';
import { formatCurrency, formatNumberWithSeparator } from '@/lib/utils';
import { IBank, IPurchase, IPurchasePayment, IPurchasePaymentItem } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface PurchasePaymentFormProps {
    purchase_payment?: IPurchasePayment;
    purchases: IPurchase[];
    banks: IBank[];
}

const PurchasePaymentForm = (props: PurchasePaymentFormProps) => {
    const { purchase_payment, purchases, banks } = props;

    const [isReady, setIsReady] = useState(false);
    const [amountDisplayValues, setAmountDisplayValues] = useState<string[]>(
        [],
    );
    const [localPurchases, setLocalPurchases] = useState<IPurchase[]>(
        purchases,
    );

    useEffect(() => {
        setLocalPurchases(prev => {
            const newPurchases = purchases.filter(p => !prev.some(prevP => prevP.id === p.id));
            if (newPurchases.length > 0) {
                return [...prev, ...newPurchases];
            }
            return prev;
        });
    }, [purchases]);

    const {
        data: dataPurchasePayment,
        setData: setDataPurchasePayment,
        processing: processingPurchasePayment,
        errors: errorsPurchasePayment,
        reset: resetpurchasePayment,

        addInvoice,
        removeInvoice,

        handleSubmit: handleSubmitPurchasePayment,
        handleCancel: handleCancelPurchasePayment,
        handleChangeInvoice,
        handleAmountChange,
    } = usePurchasePayments();

    useEffect(() => {
        if (purchase_payment) {
            setDataPurchasePayment(
                'payment_date',
                new Date(purchase_payment.payment_date),
            );
            setDataPurchasePayment(
                'total_amount',
                purchase_payment.total_amount || 0,
            );
            setDataPurchasePayment(
                'payment_method',
                purchase_payment.payment_method,
            );
            setDataPurchasePayment('bank_id', purchase_payment.bank_id ?? null);
            setDataPurchasePayment(
                'reference_number',
                purchase_payment.reference_number ?? '',
            );
            setDataPurchasePayment(
                'transfer_fee',
                purchase_payment.transfer_fee || 0,
            );
            setDataPurchasePayment('notes', purchase_payment.notes ?? '');
            setDataPurchasePayment(
                'status',
                purchase_payment.status as PurchasePaymentStatus,
            );
            const formattedAmount = (purchase_payment.items || []).map((item) =>
                item.amount ? formatCurrency(Number(item.amount)) : 'Rp. 0',
            );
            setAmountDisplayValues(formattedAmount);
            setDataPurchasePayment('items', (purchase_payment.items || []).map(item => ({
                ...item,
                amount: Number(item.amount) || 0,
                purchase_id: Number(item.purchase_id)
            })));
            setIsReady(true);
        } else {
            resetpurchasePayment();
            setAmountDisplayValues([]);
            setIsReady(true);
        }
    }, [purchase_payment, setDataPurchasePayment, resetpurchasePayment]);

    const purchaseComboboxOptions: ComboboxOption[] = localPurchases.map(
        (purchase) => ({
            value: purchase.id.toString(),
            label: `${purchase.purchase_number} - ${purchase.supplier.name} - ${formatCurrency(purchase.total_amount)}`,
        }),
    );

    const { totalAmount, totalInvoiceAmount, totalRemainingAmount } = useMemo(() => {
        let amount = 0;
        let invoice = 0;
        let remaining = 0;

        dataPurchasePayment.items.forEach((item: IPurchasePaymentItem) => {
            const itemAmount = Number(item.amount) || 0;
            amount += itemAmount;

            const purchase = localPurchases.find(
                (p) => p.id === Number(item.purchase_id),
            );

            if (purchase) {
                invoice += Number(purchase.total_amount) || 0;
                remaining += Number(purchase.remaining_amount ?? (Number(purchase.total_amount) - (purchase.total_paid || 0))) || 0;
            }
        });

        return {
            totalAmount: amount,
            totalInvoiceAmount: invoice,
            totalRemainingAmount: Math.max(0, remaining)
        };
    }, [dataPurchasePayment.items, localPurchases]);

    const overpaymentAmount = Number(dataPurchasePayment.total_amount || 0) - totalAmount;
    const grandTotal = Number(dataPurchasePayment.total_amount || 0) + Number(dataPurchasePayment.transfer_fee || 0);

    if (!isReady) {
        return <Skeleton className="h-full w-full" />;
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                handleSubmitPurchasePayment(purchase_payment);
            }}
            className="space-y-6"
        >
            <Card className="content">
                <CardHeader>
                    <CardTitle>Informasi Pembayaran</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="flex flex-col items-start gap-2">
                            <Label htmlFor="payment_date">
                                Tanggal Pembayaran{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <DatePicker
                                value={dataPurchasePayment.payment_date}
                                onChange={(value) =>
                                    setDataPurchasePayment(
                                        'payment_date',
                                        value as Date,
                                    )
                                }
                                className="input-box"
                            />
                            <InputError
                                message={errorsPurchasePayment.payment_date}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="total_amount">
                                Total Pembayaran Keluar{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="total_amount"
                                type="text"
                                value={formatNumberWithSeparator(
                                    dataPurchasePayment.total_amount || 0,
                                )}
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(
                                        /[^0-9]/g,
                                        '',
                                    );
                                    setDataPurchasePayment(
                                        'total_amount',
                                        Number(rawValue),
                                    );
                                }}
                                placeholder="Masukkan total uang yang dibayarkan"
                                className="input-box text-right"
                            />
                            <p className="text-sm text-muted-foreground">
                                Total uang yang dibayarkan ke supplier
                            </p>
                            <InputError
                                message={errorsPurchasePayment.total_amount}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="payment_method">
                                Metode Pembayaran{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={dataPurchasePayment.payment_method}
                                onValueChange={(value) => {
                                    setDataPurchasePayment(
                                        'payment_method',
                                        value as PaymentMethod,
                                    );
                                    // Reset bank/cash account selection when method changes
                                    setDataPurchasePayment('bank_id', null);
                                }}
                            >
                                <SelectTrigger className="combobox">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Tunai</SelectItem>
                                    <SelectItem value="transfer">
                                        Transfer
                                    </SelectItem>
                                    <SelectItem value="giro">Giro</SelectItem>
                                    <SelectItem value="cek">Cek</SelectItem>
                                    <SelectItem value="other">
                                        Lainnya
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError
                                message={errorsPurchasePayment.payment_method}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bank_id">Bank</Label>
                            <Select
                                value={
                                    dataPurchasePayment.bank_id?.toString() ??
                                    ''
                                }
                                onValueChange={(value) =>
                                    setDataPurchasePayment(
                                        'bank_id',
                                        Number(value),
                                    )
                                }
                            >
                                <SelectTrigger
                                    className="combobox"
                                >
                                    <SelectValue placeholder="Pilih Akun Kas/Bank..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {banks
                                        .filter((bank) =>
                                            dataPurchasePayment.payment_method ===
                                                PaymentMethod.CASH
                                                ? bank.type === 'cash'
                                                : bank.type === 'bank',
                                        )
                                        .map((bank) => (
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
                                message={errorsPurchasePayment.bank_id}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reference_number">
                                No. Referensi
                            </Label>
                            <Input
                                id="reference_number"
                                value={dataPurchasePayment.reference_number}
                                onChange={(e) =>
                                    setDataPurchasePayment(
                                        'reference_number',
                                        e.target.value,
                                    )
                                }
                                placeholder="No. transfer, cek, dll"
                                className="input-box"
                            />
                            <InputError
                                message={errorsPurchasePayment.reference_number}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="transfer_fee">Biaya Transfer</Label>
                            <Input
                                id="transfer_fee"
                                type="text"
                                value={formatNumberWithSeparator(
                                    dataPurchasePayment.transfer_fee || 0,
                                )}
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(
                                        /[^0-9]/g,
                                        '',
                                    );
                                    setDataPurchasePayment(
                                        'transfer_fee',
                                        Number(rawValue),
                                    );
                                }}
                                placeholder="Masukkan biaya transfer"
                                className="input-box text-right"
                            />
                            <p className="text-sm text-muted-foreground">
                                Biaya admin bank (jika ada)
                            </p>
                            <InputError
                                message={errorsPurchasePayment.transfer_fee}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Catatan</Label>
                        <Textarea
                            id="notes"
                            value={dataPurchasePayment.notes}
                            onChange={(e) =>
                                setDataPurchasePayment('notes', e.target.value)
                            }
                            rows={3}
                            className="input-box"
                        />
                        <InputError message={errorsPurchasePayment.notes} />
                    </div>
                </CardContent>
            </Card>

            <Card className="content">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Invoice Pembelian</CardTitle>
                        <Button
                            type="button"
                            onClick={addInvoice}
                            size="sm"
                            className="btn-primary"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Invoice
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="input-box overflow-x-auto rounded-lg">
                        <Table className="content">
                            <TableHeader>
                                <TableRow className="dark:border-b-2 dark:border-white/25">
                                    <TableHead className="min-w-[200px] text-center">
                                        Invoice
                                    </TableHead>
                                    <TableHead className="min-w-[100px] text-center">
                                        Supplier
                                    </TableHead>
                                    <TableHead className="min-w-[100px] text-center">
                                        Total Invoice
                                    </TableHead>
                                    <TableHead className="min-w-[100px] text-center">
                                        Sudah Dibayar
                                    </TableHead>
                                    <TableHead className="min-w-[100px] text-center">
                                        Sisa
                                    </TableHead>
                                    <TableHead className="min-w-[100px] text-center">
                                        Jumlah Pembayaran
                                    </TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dataPurchasePayment.items.map(
                                    (item: IPurchasePaymentItem, index: number) => {
                                        const purchase = localPurchases.find(
                                            (p) =>
                                                p.id ===
                                                Number(item.purchase_id),
                                        );
                                        const remaining = purchase
                                            ? (purchase.remaining_amount ??
                                                Number(purchase.total_amount) -
                                                (purchase.total_paid || 0))
                                            : 0;

                                        return (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Combobox
                                                        options={
                                                            purchaseComboboxOptions
                                                        }
                                                        value={
                                                            item.purchase_id
                                                                ? item.purchase_id.toString()
                                                                : ''
                                                        }
                                                        onValueChange={(
                                                            value,
                                                            option,
                                                        ) => {
                                                            if (
                                                                option &&
                                                                option.purchase
                                                            ) {
                                                                const newPurchase =
                                                                    option.purchase as IPurchase;
                                                                setLocalPurchases(
                                                                    (prev) => {
                                                                        if (
                                                                            !prev.find(
                                                                                (
                                                                                    p,
                                                                                ) =>
                                                                                    p.id ===
                                                                                    newPurchase.id,
                                                                            )
                                                                        ) {
                                                                            return [
                                                                                ...prev,
                                                                                newPurchase,
                                                                            ];
                                                                        }
                                                                        return prev;
                                                                    },
                                                                );
                                                            }
                                                            handleChangeInvoice(
                                                                index,
                                                                'purchase_id',
                                                                value,
                                                            );
                                                        }}
                                                        placeholder="Pilih invoice..."
                                                        searchPlaceholder="Cari invoice..."
                                                        searchUrl="/purchase-payments/search-purchases"
                                                        className="combobox"
                                                        filterOption={(opt) => {
                                                            const isSelectedInOtherRow =
                                                                dataPurchasePayment.items.some(
                                                                    (
                                                                        otherItem: IPurchasePaymentItem,
                                                                        otherIdx: number,
                                                                    ) =>
                                                                        otherIdx !==
                                                                        index &&
                                                                        otherItem.purchase_id?.toString() ===
                                                                        opt.value,
                                                                );
                                                            return !isSelectedInOtherRow;
                                                        }}
                                                    />
                                                    <InputError
                                                        message={
                                                            (
                                                                errorsPurchasePayment as Record<
                                                                    string,
                                                                    string
                                                                >
                                                            )[
                                                            `items[${index}].purchase_id`
                                                            ]
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {purchase?.supplier?.name ||
                                                        '-'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {purchase
                                                        ? formatCurrency(
                                                            purchase.total_amount,
                                                        )
                                                        : '-'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {purchase
                                                        ? formatCurrency(
                                                            purchase.total_paid ||
                                                            0,
                                                        )
                                                        : '-'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {purchase ? (
                                                        <span
                                                            className={
                                                                remaining > 0
                                                                    ? 'font-medium text-red-600 dark:text-danger-500'
                                                                    : 'font-medium text-green-600 dark:text-emerald-500'
                                                            }
                                                        >
                                                            {formatCurrency(
                                                                remaining,
                                                            )}
                                                        </span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Input
                                                        type="text"
                                                        value={
                                                            amountDisplayValues[
                                                            index
                                                            ] ?? '0'
                                                        }
                                                        onChange={(e) => {
                                                            handleAmountChange(
                                                                index,
                                                                e,
                                                                amountDisplayValues,
                                                                setAmountDisplayValues,
                                                            );
                                                        }}
                                                        placeholder="0"
                                                        className="input-box text-right"
                                                        disabled={
                                                            !item.purchase_id
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            (
                                                                errorsPurchasePayment as Record<
                                                                    string,
                                                                    string
                                                                >
                                                            )[
                                                            `items[${index}].amount`
                                                            ]
                                                        }
                                                        className="text-left"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            removeInvoice(index)
                                                        }
                                                        disabled={
                                                            dataPurchasePayment
                                                                .items
                                                                .length === 1
                                                        }
                                                        className="btn-trash"
                                                    >
                                                        <Trash2 />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    },
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <div className="space-y-2 text-right">
                            <div className="flex justify-end gap-8 text-sm">
                                <span className="text-muted-foreground">Total Invoice:</span>
                                <span className="font-medium text-foreground">{formatCurrency(totalInvoiceAmount)}</span>
                            </div>
                            <div className="flex justify-end gap-8 text-sm">
                                <span className="text-muted-foreground">Total Sisa:</span>
                                <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(totalRemainingAmount)}</span>
                            </div>
                            <div className="border-t border-border pt-2">
                                <div className="flex justify-end gap-8 items-center">
                                    <span className="text-sm text-muted-foreground mr-2 text-red-600 dark:text-red-400">Total Pembayaran:</span>
                                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(Number(dataPurchasePayment.total_amount) || 0)}</span>
                                </div>
                                <div className="flex justify-end gap-8 items-center">
                                    <span className="text-sm text-muted-foreground mr-2">Biaya Transfer:</span>
                                    <span className="text-xl font-semibold">{formatCurrency(Number(dataPurchasePayment.transfer_fee) || 0)}</span>
                                </div>
                                <div className="flex justify-end gap-8 items-center border-t border-border mt-2 pt-2">
                                    <span className="text-sm font-bold mr-2">Total Bank (Grand Total):</span>
                                    <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{formatCurrency(grandTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Overpayment Summary */}
                    <div className="mt-6 rounded-lg border-2 border-orange-200 bg-orange-50 p-4 dark:bg-orange-950/20">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Total Dibayarkan:
                                </span>
                                <span className="font-semibold">
                                    {formatCurrency(
                                        dataPurchasePayment.total_amount || 0,
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Total Dialokasikan:
                                </span>
                                <span className="font-semibold">
                                    {formatCurrency(totalAmount)}
                                </span>
                            </div>
                            <div className="h-px bg-orange-300" />
                            <div className="flex justify-between">
                                <span
                                    className={
                                        overpaymentAmount < 0
                                            ? 'font-medium text-red-600'
                                            : 'font-medium'
                                    }
                                >
                                    {overpaymentAmount < 0
                                        ? 'Kelebihan Alokasi:'
                                        : 'Sisa/Overpayment:'}
                                </span>
                                <span
                                    className={
                                        overpaymentAmount < 0
                                            ? 'text-lg font-bold text-red-600'
                                            : 'text-lg font-bold text-green-600'
                                    }
                                >
                                    {formatCurrency(Math.abs(overpaymentAmount))}
                                </span>
                            </div>
                            {overpaymentAmount > 0 && (
                                <p className="text-xs text-orange-700 dark:text-orange-400">
                                    ⚠️ Kelebihan pembayaran akan dicatat
                                    sebagai Uang Muka Pembelian
                                </p>
                            )}
                            {overpaymentAmount < 0 && (
                                <p className="text-xs text-red-600">
                                    ❌ Total alokasi tidak boleh melebihi
                                    total pembayaran dibayarkan
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card >

            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelPurchasePayment}
                    className="btn-secondary"
                >
                    Reset
                </Button>
                <Button
                    type="submit"
                    disabled={processingPurchasePayment}
                    className="btn-primary"
                >
                    {processingPurchasePayment
                        ? 'Menyimpan...'
                        : purchase_payment
                            ? 'Perbarui'
                            : 'Simpan'}
                </Button>
            </div>
        </form >
    );
};

export default PurchasePaymentForm;
