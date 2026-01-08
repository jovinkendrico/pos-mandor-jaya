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
import { PaymentMethod, SalePaymentStatus } from '@/constants/enum';
import useSalePayments from '@/hooks/use-sale-payment';
import { formatCurrency, formatNumberWithSeparator } from '@/lib/utils';
import { IBank, ISale, ISalePayment } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface SalePaymentFormProps {
    sale_payment?: ISalePayment;
    sales: ISale[];
    banks: IBank[];
}

const SalePaymentForm = (props: SalePaymentFormProps) => {
    const { sale_payment, sales, banks } = props;

    const [isReady, setIsReady] = useState(false);
    const [amountDisplayValues, setAmountDisplayValues] = useState<string[]>(
        [],
    );
    const [localSales, setLocalSales] = useState<ISale[]>(sales);

    useEffect(() => {
        setLocalSales(prev => {
            const newSales = sales.filter(s => !prev.some(prevS => prevS.id === s.id));
            if (newSales.length > 0) {
                return [...prev, ...newSales];
            }
            return prev;
        });
    }, [sales]);

    const {
        data: dataSalePayment,
        setData: setDataSalePayment,
        processing: processingSalePayment,
        errors: errorsSalePayment,
        reset: resetSalePayment,

        addInvoice,
        removeInvoice,

        handleSubmit: handleSubmitSalePayment,
        handleCancel: handleCancelSalePayment,
        handleChangeInvoice,
        handleAmountChange,
    } = useSalePayments();

    useEffect(() => {
        if (sale_payment) {
            setDataSalePayment(
                'payment_date',
                new Date(sale_payment.payment_date),
            );
            setDataSalePayment(
                'payment_method',
                sale_payment.payment_method,
            );
            setDataSalePayment('bank_id', sale_payment.bank_id ?? null);
            setDataSalePayment(
                'reference_number',
                sale_payment.reference_number ?? '',
            );
            setDataSalePayment('notes', sale_payment.notes ?? '');
            setDataSalePayment(
                'status',
                sale_payment.status as SalePaymentStatus,
            );
            const formattedAmount = sale_payment.items.map((item) =>
                item.amount ? formatNumberWithSeparator(item.amount) : '0',
            );
            setAmountDisplayValues(formattedAmount);
            setDataSalePayment('items', sale_payment.items);
            setIsReady(true);
        } else {
            resetSalePayment();
            setAmountDisplayValues([]);
            setIsReady(true);
        }
    }, [sale_payment, setDataSalePayment, resetSalePayment]);

    const saleComboboxOptions: ComboboxOption[] = localSales.map(
        (sale) => ({
            value: sale.id.toString(),
            label: `${sale.sale_number} - ${sale.customer.name} - ${formatCurrency(sale.total_amount)}`,
        }),
    );

    const totalAmount = useMemo(() => {
        return dataSalePayment.items.reduce(
            (sum, item) => sum + (item.amount || 0),
            0,
        );
    }, [dataSalePayment.items]);

    if (!isReady) {
        return <Skeleton className="h-full w-full" />;
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                handleSubmitSalePayment(sale_payment);
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
                                value={dataSalePayment.payment_date}
                                onChange={(value) =>
                                    setDataSalePayment(
                                        'payment_date',
                                        value as Date,
                                    )
                                }
                                className="input-box"
                            />
                            <InputError
                                message={errorsSalePayment.payment_date}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="payment_method">
                                Metode Pembayaran{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={dataSalePayment.payment_method}
                                onValueChange={(value) => {
                                    setDataSalePayment(
                                        'payment_method',
                                        value as PaymentMethod,
                                    );
                                    // Reset bank/cash account selection when method changes
                                    setDataSalePayment('bank_id', null);
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
                                message={errorsSalePayment.payment_method}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bank_id">Bank</Label>
                            <Select
                                value={
                                    dataSalePayment.bank_id?.toString() ??
                                    ''
                                }
                                onValueChange={(value) =>
                                    setDataSalePayment(
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
                                            dataSalePayment.payment_method ===
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
                                message={errorsSalePayment.bank_id}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reference_number">
                                No. Referensi
                            </Label>
                            <Input
                                id="reference_number"
                                value={dataSalePayment.reference_number}
                                onChange={(e) =>
                                    setDataSalePayment(
                                        'reference_number',
                                        e.target.value,
                                    )
                                }
                                placeholder="No. transfer, cek, dll"
                                className="input-box"
                            />
                            <InputError
                                message={errorsSalePayment.reference_number}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Catatan</Label>
                        <Textarea
                            id="notes"
                            value={dataSalePayment.notes}
                            onChange={(e) =>
                                setDataSalePayment('notes', e.target.value)
                            }
                            rows={3}
                            className="input-box"
                        />
                        <InputError message={errorsSalePayment.notes} />
                    </div>
                </CardContent>
            </Card>

            <Card className="content">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Invoice Penjualan</CardTitle>
                        <Button
                            type="button"
                            onClick={addInvoice}
                            variant="outline"
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
                                        Customer
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
                                {dataSalePayment.items.map(
                                    (item, index) => {
                                        const sale = localSales.find(
                                            (s) =>
                                                s.id ===
                                                Number(item.sale_id),
                                        );
                                        const remaining = sale
                                            ? (sale.remaining_amount ??
                                                Number(sale.total_amount) -
                                                (sale.total_paid || 0))
                                            : 0;

                                        return (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Combobox
                                                        options={
                                                            saleComboboxOptions
                                                        }
                                                        value={
                                                            item.sale_id
                                                                ? item.sale_id.toString()
                                                                : ''
                                                        }
                                                        onValueChange={(
                                                            value,
                                                            option,
                                                        ) => {
                                                            if (
                                                                option &&
                                                                option.sale
                                                            ) {
                                                                const newSale =
                                                                    option.sale as ISale;
                                                                setLocalSales(
                                                                    (prev) => {
                                                                        if (
                                                                            !prev.find(
                                                                                (
                                                                                    s,
                                                                                ) =>
                                                                                    s.id ===
                                                                                    newSale.id,
                                                                            )
                                                                        ) {
                                                                            return [
                                                                                ...prev,
                                                                                newSale,
                                                                            ];
                                                                        }
                                                                        return prev;
                                                                    },
                                                                );
                                                            }

                                                            handleChangeInvoice(
                                                                index,
                                                                'sale_id',
                                                                value,
                                                            );
                                                        }}
                                                        placeholder="Pilih invoice..."
                                                        searchPlaceholder="Cari invoice..."
                                                        searchUrl="/sale-payments/search-sales"
                                                        className="combobox"
                                                    />
                                                    <InputError
                                                        message={
                                                            (
                                                                errorsSalePayment as Record<
                                                                    string,
                                                                    string
                                                                >
                                                            )[
                                                            `items[${index}].sale_id`
                                                            ]
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {sale?.customer?.name ||
                                                        '-'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {sale
                                                        ? formatCurrency(
                                                            sale.total_amount,
                                                        )
                                                        : '-'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {sale
                                                        ? formatCurrency(
                                                            sale.total_paid ||
                                                            0,
                                                        )
                                                        : '-'}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {sale ? (
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
                                                            !item.sale_id
                                                        }
                                                    />
                                                    <InputError
                                                        message={
                                                            (
                                                                errorsSalePayment as Record<
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
                                                            dataSalePayment
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
                        <div className="space-y-1 text-right">
                            <div className="text-sm text-muted-foreground">
                                Total Pembayaran
                            </div>
                            <div className="text-2xl font-bold">
                                {formatCurrency(totalAmount)}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelSalePayment}
                    className="btn-secondary"
                >
                    Reset
                </Button>
                <Button
                    type="submit"
                    disabled={processingSalePayment}
                    className="btn-primary"
                >
                    {processingSalePayment
                        ? 'Menyimpan...'
                        : sale_payment
                            ? 'Perbarui'
                            : 'Simpan'}
                </Button>
            </div>
        </form>
    );
};

export default SalePaymentForm;

