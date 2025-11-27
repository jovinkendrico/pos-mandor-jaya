import { Button } from '@/components/ui/button';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import useChartOfAccounts from '@/hooks/use-chart-of-accounts';
import { IChartOfAccount } from '@/types';
import { useEffect, useMemo } from 'react';
import InputError from '../../input-error';
import { Checkbox } from '../../ui/checkbox';
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

interface ChartOfAccountFormProps {
    chartOfAccount?: IChartOfAccount;
    isModalOpen: boolean;
    onModalClose: () => void;
    parentAccounts?: IChartOfAccount[];
}

const ChartOfAccountForm = (props: ChartOfAccountFormProps) => {
    const {
        chartOfAccount,
        isModalOpen,
        onModalClose,
        parentAccounts = [],
    } = props;

    const {
        data,
        setData,
        errors,
        processing,
        reset,
        handleSubmit,
        handleCancel,
    } = useChartOfAccounts(onModalClose);

    const parentComboboxOptions: ComboboxOption[] = useMemo(() => {
        const noneOption: ComboboxOption = {
            value: 'none',
            label: 'Tidak ada',
        };

        const parentOptions = parentAccounts.map((parent) => ({
            label: `${parent.code} - ${parent.name}`,
            value: parent.id.toString(),
        }));

        return [noneOption, ...parentOptions];
    }, [parentAccounts]);

    useEffect(() => {
        if (chartOfAccount) {
            setData({
                code: chartOfAccount.code,
                name: chartOfAccount.name,
                type: chartOfAccount.type,
                parent_id: chartOfAccount.parent_id || null,
                description: chartOfAccount.description || '',
                is_active: chartOfAccount.is_active,
            });
        } else {
            reset();
        }
    }, [chartOfAccount, isModalOpen, reset, setData]);

    return (
        <Dialog open={isModalOpen} onOpenChange={onModalClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {chartOfAccount
                            ? 'Edit Chart of Account'
                            : 'Tambah Chart of Account'}
                    </DialogTitle>
                    <DialogDescription>
                        {chartOfAccount
                            ? 'Perbarui informasi chart of account di bawah.'
                            : 'Isi data detail untuk menambahkan chart of account baru'}
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit(chartOfAccount);
                    }}
                    className="flex flex-col space-y-2"
                >
                    <div className="flex flex-col space-y-4 pb-4">
                        <div className="flex flex-row gap-4">
                            <div className="w-1/3">
                                <Label htmlFor="code" required>
                                    Kode Akun
                                </Label>
                                <Input
                                    id="code"
                                    name="code"
                                    value={data.code}
                                    onChange={(e) =>
                                        setData('code', e.target.value)
                                    }
                                    className="input-box"
                                    placeholder="1100"
                                />
                                {errors.code && (
                                    <InputError message={errors.code} />
                                )}
                            </div>

                            <div className="w-2/3">
                                <Label htmlFor="name" required>
                                    Nama Akun
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    className="input-box"
                                    placeholder="Kas"
                                />
                                {errors.name && (
                                    <InputError message={errors.name} />
                                )}
                            </div>
                        </div>

                        <div className="flex flex-row gap-4">
                            <div className="w-1/2">
                                <Label htmlFor="type" required>
                                    Tipe Akun
                                </Label>
                                <Select
                                    value={data.type}
                                    onValueChange={(
                                        value:
                                            | 'asset'
                                            | 'liability'
                                            | 'equity'
                                            | 'income'
                                            | 'expense',
                                    ) => setData('type', value)}
                                >
                                    <SelectTrigger className="w-full font-medium dark:!bg-white dark:!text-primary-200">
                                        <SelectValue placeholder="Pilih Tipe" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:data-[selected=true]:bg-primary-400/30">
                                        <SelectItem value="asset">
                                            Aset
                                        </SelectItem>
                                        <SelectItem value="liability">
                                            Kewajiban
                                        </SelectItem>
                                        <SelectItem value="equity">
                                            Ekuitas
                                        </SelectItem>
                                        <SelectItem value="income">
                                            Pendapatan
                                        </SelectItem>
                                        <SelectItem value="expense">
                                            Biaya
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.type && (
                                    <InputError message={errors.type} />
                                )}
                            </div>

                            <div className="w-1/2">
                                <Label htmlFor="parent_id">Parent Akun</Label>
                                <Combobox
                                    options={parentComboboxOptions}
                                    value={
                                        data.parent_id
                                            ? data.parent_id.toString()
                                            : 'none'
                                    }
                                    onValueChange={(value) =>
                                        setData(
                                            'parent_id',
                                            value === 'none'
                                                ? null
                                                : Number(value),
                                        )
                                    }
                                    placeholder="Pilih Parent (Opsional)"
                                    searchPlaceholder="Cari Parent..."
                                    className="combobox"
                                    maxDisplayItems={10}
                                />
                                {errors.parent_id && (
                                    <InputError message={errors.parent_id} />
                                )}
                            </div>
                        </div>

                        <div className="flex flex-row gap-4">
                            <div className="flex w-full items-center gap-2">
                                <Checkbox
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) =>
                                        setData('is_active', checked === true)
                                    }
                                    className="cursor-pointer dark:border-white"
                                />
                                <Label htmlFor="is_active">Aktif</Label>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="description">Deskripsi</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                rows={3}
                                className="input-box"
                                placeholder="Deskripsi akun..."
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
                            ) : chartOfAccount ? (
                                'Update Chart of Account'
                            ) : (
                                'Tambah Chart of Account'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ChartOfAccountForm;
