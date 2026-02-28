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
import useCashOut from '@/hooks/use-cash-out';
import { formatCurrency, compressImage } from '@/lib/utils';
import { IBank, ICashOut, IChartOfAccount, IVehicle } from '@/types';
import { useEffect, useState } from 'react';

interface CashOutFormProps {
    cashOut?: ICashOut;
    banks: IBank[];
    expenseAccounts: IChartOfAccount[];
    vehicles: IVehicle[];
}

const CashOutForm = (props: CashOutFormProps) => {
    const { cashOut, banks, expenseAccounts, vehicles } = props;

    const [isReady, setIsReady] = useState(false);
    const [displayAmount, setDisplayAmount] = useState('');

    const {
        data: dataCashOut,
        setData: setDataCashOut,
        errors: errorsCashOut,
        processing: processingCashOut,
        reset: resetCashOut,

        handleSubmit: handleSubmitCashOut,
        handleCancel: handleCancelCashOut,
        handlePriceChange,
    } = useCashOut();

    useEffect(() => {
        if (cashOut?.amount) {
            setDisplayAmount(formatCurrency(cashOut.amount));
        }
    }, [cashOut]);

    const bankOptions = banks.map((bank) => ({
        value: bank.id.toString(),
        label: `${bank.name} (${formatCurrency(bank.balance)})`,
    }));

    const accountOptions = expenseAccounts.map((account) => {
        const parentName = account.parent ? `[${account.parent.name}] ` : '';
        return {
            value: account.id.toString(),
            label: `${parentName}${account.code} - ${account.name}`,
        };
    });

    const vehicleOptions = vehicles.map((vehicle) => ({
        value: vehicle.id.toString(),
        label: `${vehicle.police_number} - ${vehicle.name || vehicle.driver || ''}`,
    }));

    useEffect(() => {
        if (cashOut) {
            setDataCashOut('cash_out_date', cashOut.cash_out_date);
            setDataCashOut('bank_id', cashOut.bank_id);
            setDataCashOut('chart_of_account_id', cashOut.chart_of_account_id);
            setDataCashOut('amount', cashOut.amount);
            setDataCashOut('description', cashOut.description ?? '');
            setDataCashOut('attachment', cashOut.attachment ?? null);
            setDataCashOut('auto_post', cashOut.auto_post ?? false);
            setDataCashOut('vehicle_id', cashOut.vehicle_id ? cashOut.vehicle_id.toString() : '');
            setIsReady(true);
        } else {
            resetCashOut();
            setIsReady(true);
        }
    }, [cashOut, resetCashOut, setDataCashOut]);

    if (!isReady) {
        return <Skeleton className="h-full w-full" />;
    }
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                handleSubmitCashOut(cashOut);
            }}
            className="space-y-6"
        >
            <Card className="content">
                <CardHeader>
                    <CardTitle>Informasi Kas Keluar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="cash_out_date">
                                Tanggal <span className="text-red-500">*</span>
                            </Label>
                            <DatePicker
                                value={dataCashOut.cash_out_date}
                                onChange={(date) =>
                                    setDataCashOut(
                                        'cash_out_date',
                                        date ? date : new Date(),
                                    )
                                }
                                className="input-box"
                            />
                            <InputError message={errorsCashOut.cash_out_date} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bank_id">
                                Bank/Kas <span className="text-red-500">*</span>
                            </Label>
                            <Combobox
                                options={bankOptions}
                                value={dataCashOut.bank_id.toString()}
                                onValueChange={(value) =>
                                    setDataCashOut('bank_id', Number(value))
                                }
                                placeholder="Pilih Bank/Kas"
                                searchPlaceholder="Cari Bank/Kas..."
                                className="combobox"
                            />
                            <InputError message={errorsCashOut.bank_id} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="chart_of_account_id">
                                Akun Pengeluaran <span className="text-red-500">*</span>
                            </Label>
                            <Combobox
                                options={accountOptions}
                                value={dataCashOut.chart_of_account_id.toString()}
                                onValueChange={(value) =>
                                    setDataCashOut(
                                        'chart_of_account_id',
                                        Number(value),
                                    )
                                }
                                placeholder="Pilih Akun Pengeluaran"
                                searchPlaceholder="Cari Akun..."
                                className="combobox"
                            />
                            <InputError
                                message={errorsCashOut.chart_of_account_id}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="vehicle_id">Kendaraan (Opsional)</Label>
                            <Combobox
                                options={vehicleOptions}
                                value={dataCashOut.vehicle_id ? dataCashOut.vehicle_id.toString() : ''}
                                onValueChange={(value) =>
                                    setDataCashOut(
                                        'vehicle_id',
                                        value ? Number(value) : null,
                                    )
                                }
                                placeholder="Pilih Kendaraan"
                                searchPlaceholder="Cari Kendaraan..."
                                className="combobox"
                            />
                            <InputError message={errorsCashOut.vehicle_id} />
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
                                    handlePriceChange(
                                        e,
                                        displayAmount,
                                        setDisplayAmount,
                                    );
                                }}
                                placeholder="0"
                                className="input-box text-right"
                            />
                            <InputError message={errorsCashOut.amount} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Keterangan</Label>
                        <Textarea
                            id="description"
                            value={dataCashOut.description}
                            onChange={(e) =>
                                setDataCashOut('description', e.target.value)
                            }
                            placeholder="Masukkan keterangan kas keluar"
                            rows={3}
                            className="input-box"
                        />
                        <InputError message={errorsCashOut.description} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="attachment">Upload Bukti Bon (Gambar/Foto)</Label>
                        <div className="flex flex-col gap-4 md:flex-row md:items-start">
                            <div className="flex-1 space-y-2">
                                <Input
                                    id="attachment"
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files ? e.target.files[0] : null;
                                        if (file && file.type.startsWith('image/')) {
                                            try {
                                                const compressed = await compressImage(file);
                                                setDataCashOut('attachment', compressed);
                                            } catch (error) {
                                                console.error('Compression failed', error);
                                                setDataCashOut('attachment', file);
                                            }
                                        } else {
                                            setDataCashOut('attachment', file);
                                        }
                                    }}
                                    className="input-box"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Format: JPG, PNG. Maksimal 2MB. Gambar akan otomatis dikompres.
                                </p>
                                <InputError message={errorsCashOut.attachment} />
                            </div>

                            {(dataCashOut.attachment || cashOut?.attachment_url) && (
                                <div className="relative h-24 w-24 overflow-hidden rounded-md border bg-muted">
                                    {dataCashOut.attachment instanceof File ? (
                                        <img
                                            src={URL.createObjectURL(dataCashOut.attachment)}
                                            alt="Preview"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : cashOut?.attachment_url ? (
                                        <img
                                            src={cashOut.attachment_url}
                                            alt="Existing"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </div>

                    {!cashOut && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="auto_post"
                                checked={dataCashOut.auto_post}
                                onCheckedChange={(checked) =>
                                    setDataCashOut('auto_post', checked === true)
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
                            onClick={handleCancelCashOut}
                            className="btn-secondary"
                        >
                            Reset
                        </Button>
                        <Button
                            type="submit"
                            disabled={processingCashOut}
                            className="btn-primary"
                        >
                            {processingCashOut
                                ? 'Menyimpan...'
                                : cashOut
                                    ? 'Perbarui'
                                    : 'Simpan'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
};

export default CashOutForm;

