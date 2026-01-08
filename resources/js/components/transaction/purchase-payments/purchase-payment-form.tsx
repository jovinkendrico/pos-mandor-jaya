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
import { IBank, IPurchase, IPurchasePayment } from '@/types';
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
                purchase_payment.payment_date,
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
            setDataPurchasePayment('notes', purchase_payment.notes ?? '');
            setDataPurchasePayment(
                'status',
                purchase_payment.status as PurchasePaymentStatus,
            );
            const formattedAmount = purchase_payment.items.map((item) =>
                item.amount ? formatNumberWithSeparator(item.amount) : '0',
            );
            setAmountDisplayValues(formattedAmount);
            setDataPurchasePayment('items', purchase_payment.items);
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

        dataPurchasePayment.items.forEach((item) => {
            amount += item.amount || 0;

            const purchase = localPurchases.find(
                (p) => p.id === Number(item.purchase_id),
            );

            if (purchase) {
                invoice += Number(purchase.total_amount);
                remaining += (purchase.remaining_amount ?? (Number(purchase.total_amount) - (purchase.total_paid || 0)));
            }
        });

        return {
            totalAmount: amount,
            totalInvoiceAmount: invoice,
            totalRemainingAmount: remaining
        };
    }, [dataPurchasePayment.items, localPurchases]);

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
            {/* ... previous code ... */}

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
                            <span className="text-sm text-muted-foreground">Total Pembayaran:</span>
                            <span className="text-2xl font-bold">{formatCurrency(totalAmount)}</span>
                        </div>
                    </div>
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
