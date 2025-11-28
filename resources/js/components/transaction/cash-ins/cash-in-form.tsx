import { DatePicker } from '@/components/date-picker';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import useCashIn from '@/hooks/use-cash-in';
import { formatCurrency } from '@/lib/utils';
import { IBank, ICashIn, IChartOfAccount } from '@/types';
import { useEffect, useState } from 'react';

interface CashInFormProps {
    cashIn?: ICashIn;
    banks: IBank[];
    incomeAccounts: IChartOfAccount[];
}

const CashInForm = (props: CashInFormProps) => {
    const { cashIn, banks, incomeAccounts } = props;

    const [isReady, setIsReady] = useState(false);
    const [displayAmount, setDisplayAmount] = useState('');

    const {
        data: dataCashIn,
        setData: setDataCashIn,
        errors: errorsCashIn,
        processing: processingCashIn,
        reset: resetCashIn,

        handleSubmit: handleSubmitCashIn,
        handleCancel: handleCancelCashIn,
        handlePriceChange,
    } = useCashIn();

    useEffect(() => {
        if (cashIn?.amount) {
            setDisplayAmount(formatCurrency(cashIn.amount));
        }
    }, [cashIn]);

    const bankOptions = banks.map((bank) => ({
        value: bank.id.toString(),
        label: `${bank.name} (${formatCurrency(bank.balance)})`,
    }));

    const accountOptions = incomeAccounts.map((account) => ({
        value: account.id.toString(),
        label: `${account.code} - ${account.name}`,
    }));

    useEffect(() => {
        if (cashIn) {
            setDataCashIn('cash_in_date', cashIn.cash_in_date);
            setDataCashIn('bank_id', cashIn.bank_id);
            setDataCashIn('chart_of_account_id', cashIn.chart_of_account_id);
            setDataCashIn('amount', cashIn.amount);
            setDataCashIn('description', cashIn.description ?? '');
            setDataCashIn('auto_post', cashIn.auto_post ?? false);
            setIsReady(true);
        } else {
            resetCashIn();
            setIsReady(true);
        }
    }, [cashIn, resetCashIn, setDataCashIn]);

    if (!isReady) {
        return <Skeleton className="h-full w-full" />;
    }
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                handleSubmitCashIn(cashIn);
            }}
            className="space-y-6"
        >
            <Card className="content">
                <CardHeader>
                    <CardTitle>Informasi Kas Masuk</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="cash_in_date">
                                Tanggal <span className="text-red-500">*</span>
                            </Label>
                            <DatePicker
                                value={dataCashIn.cash_in_date}
                                onChange={(date) =>
                                    setDataCashIn(
                                        'cash_in_date',
                                        date ? date : new Date(),
                                    )
                                }
                                className="input-box"
                            />
                            <InputError message={errorsCashIn.cash_in_date} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bank_id">
                                Bank/Kas <span className="text-red-500">*</span>
                            </Label>
                            <Combobox
                                options={bankOptions}
                                value={dataCashIn.bank_id.toString()}
                                onValueChange={(value) =>
                                    setDataCashIn('bank_id', Number(value))
                                }
                                placeholder="Pilih Bank/Kas"
                                searchPlaceholder="Cari Bank/Kas..."
                                className="combobox"
                            />
                            <InputError message={errorsCashIn.bank_id} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="chart_of_account_id">
                                Akun Pendapatan *
                            </Label>
                            <Combobox
                                options={accountOptions}
                                value={dataCashIn.chart_of_account_id.toString()}
                                onValueChange={(value) =>
                                    setDataCashIn(
                                        'chart_of_account_id',
                                        Number(value),
                                    )
                                }
                                placeholder="Pilih Akun Pendapatan"
                                searchPlaceholder="Cari Akun..."
                                className="combobox"
                            />
                            <InputError
                                message={errorsCashIn.chart_of_account_id}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">
                                Jumlah <span className="text-red-600">*</span>
                            </Label>
                            <Input
                                id="amount"
                                type="text"
                                value={displayAmount}
                                onChange={(e) => {
                                    handlePriceChange(e, setDisplayAmount);
                                }}
                                placeholder="0"
                                className="input-box text-right"
                            />
                            <InputError message={errorsCashIn.amount} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Keterangan</Label>
                        <Textarea
                            id="description"
                            value={dataCashIn.description}
                            onChange={(e) =>
                                setDataCashIn('description', e.target.value)
                            }
                            placeholder="Masukkan keterangan kas masuk"
                            rows={3}
                            className="input-box"
                        />
                        <InputError message={errorsCashIn.description} />
                    </div>

                    {!cashIn && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="auto_post"
                                checked={dataCashIn.auto_post}
                                onCheckedChange={(checked) =>
                                    setDataCashIn('auto_post', checked === true)
                                }
                                className="cursor-pointer dark:border-white"
                            />
                            <Label htmlFor="auto_post">
                                Posting otomatis ke jurnal
                            </Label>
                        </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCancelCashIn}
                            className="btn-secondary"
                        >
                            Reset
                        </Button>
                        <Button
                            type="submit"
                            disabled={processingCashIn}
                            className="btn-primary"
                        >
                            {processingCashIn
                                ? 'Menyimpan...'
                                : cashIn
                                  ? 'Perbarui'
                                  : 'Simpan'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
};

export default CashInForm;
