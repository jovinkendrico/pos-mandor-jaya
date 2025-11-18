import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import useBanks from '@/hooks/use-banks';
import { formatCurrency, parseCurrency } from '@/lib/utils';
import { IBank, IChartOfAccount } from '@/types';
import { ChangeEvent, useEffect, useState } from 'react';
import InputError from '../../input-error';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../ui/select';
import { Textarea } from '../../ui/textarea';

interface BankFormProps {
    bank?: IBank;
    isModalOpen: boolean;
    onModalClose: () => void;
    chartOfAccounts?: IChartOfAccount[];
}

const BankForm = (props: BankFormProps) => {
    const { bank, isModalOpen, onModalClose, chartOfAccounts = [] } = props;

    const {
        data,
        setData,
        errors,
        processing,
        reset,

        handleSubmit,
        handleCancel,
    } = useBanks(onModalClose);

    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        if (bank) {
            setData({
                name: bank.name,
                type: bank.type,
                chart_of_account_id: bank.chart_of_account_id || null,
                account_number: bank.account_number || '',
                account_name: bank.account_name || '',
                balance: bank.balance || 0,
                description: bank.description || '',
            });
        } else {
            reset();
        }
    }, [bank, isModalOpen, reset, setData]);

    useEffect(() => {
        setDisplayValue(formatCurrency(data.balance));
    }, [data.balance]);

    const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;

        if (input === '') {
            setData('balance', 0);
            setDisplayValue('');
            return;
        }

        if (input && !input.startsWith('Rp. ')) {
            setDisplayValue(formatCurrency(data.balance));
            return;
        }

        const rawValue = parseCurrency(input);

        setData('balance', rawValue as number);

        setDisplayValue(formatCurrency(rawValue));
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={onModalClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {bank ? 'Edit Bank/Cash' : 'Tambah Bank/Cash'}
                    </DialogTitle>
                    <DialogDescription>
                        {bank
                            ? 'Perbarui informasi bank/cash di bawah.'
                            : 'Isi data detail untuk menambahkan bank/cash baru'}
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit(bank);
                    }}
                    className="flex flex-col space-y-2"
                >
                    <div className="flex flex-col space-y-4 pb-4">
                        <div className="flex flex-row gap-4">
                            <div className="w-2/3">
                                <Label htmlFor="name" required>
                                    Nama Bank/Cash
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    className="input-box"
                                />
                                {errors.name && (
                                    <InputError message={errors.name} />
                                )}
                            </div>

                            <div className="w-1/3">
                                <Label htmlFor="type" required>
                                    Tipe
                                </Label>
                                <Select
                                    value={data.type}
                                    onValueChange={(value: 'bank' | 'cash') =>
                                        setData('type', value)
                                    }
                                >
                                    <SelectTrigger className="w-full font-medium dark:!bg-white dark:!text-primary-200">
                                        <SelectValue placeholder="Pilih Tipe" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:data-[selected=true]:bg-primary-400/30">
                                        <SelectItem value="bank">
                                            Bank
                                        </SelectItem>
                                        <SelectItem value="cash">
                                            Cash
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.type && (
                                    <InputError message={errors.type} />
                                )}
                            </div>
                        </div>

                        {data.type === 'bank' && (
                            <>
                                <div className="flex flex-row gap-4">
                                    <div className="w-1/2">
                                        <Label htmlFor="account_number">
                                            Nomor Rekening
                                        </Label>
                                        <Input
                                            id="account_number"
                                            name="account_number"
                                            value={data.account_number}
                                            onChange={(e) =>
                                                setData(
                                                    'account_number',
                                                    e.target.value,
                                                )
                                            }
                                            className="input-box"
                                        />
                                        {errors.account_number && (
                                            <InputError
                                                message={errors.account_number}
                                            />
                                        )}
                                    </div>

                                    <div className="w-1/2">
                                        <Label htmlFor="account_name">
                                            Nama Pemilik Rekening
                                        </Label>
                                        <Input
                                            id="account_name"
                                            name="account_name"
                                            value={data.account_name}
                                            onChange={(e) =>
                                                setData(
                                                    'account_name',
                                                    e.target.value,
                                                )
                                            }
                                            className="input-box"
                                        />
                                        {errors.account_name && (
                                            <InputError
                                                message={errors.account_name}
                                            />
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        <div>
                            <Label htmlFor="balance">Saldo Awal</Label>
                            <Input
                                id="balance"
                                name="balance"
                                type="text"
                                value={displayValue}
                                onChange={handlePriceChange}
                                className="input-box"
                            />
                            {errors.balance && (
                                <InputError message={errors.balance} />
                            )}
                        </div>

                        <div>
                            <Label htmlFor="description">
                                Deskripsi/Catatan
                            </Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                rows={3}
                                className="input-box"
                            />
                            {errors.description && (
                                <InputError message={errors.description} />
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCancel}
                            disabled={processing}
                            className="btn-secondary"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="btn-primary"
                        >
                            {processing ? (
                                <Spinner />
                            ) : bank ? (
                                'Update Bank/Cash'
                            ) : (
                                'Tambah Bank/Cash'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default BankForm;
