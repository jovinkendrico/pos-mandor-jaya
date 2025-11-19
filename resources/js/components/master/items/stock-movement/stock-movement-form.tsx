import { DatePicker } from '@/components/date-picker';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import useStockMovement from '@/hooks/use-stock-movement';
import { formatNumber } from '@/lib/utils';
import { IItemStockMovement } from '@/types';
import { Dialog, DialogDescription } from '@radix-ui/react-dialog';
import { useEffect } from 'react';

interface StockMovementFormProps {
    item_id: number;
    isModalOpen: boolean;
    onModalclose: () => void;
    stock_movement?: IItemStockMovement;
}

const StockMovementForm = (props: StockMovementFormProps) => {
    const { item_id, isModalOpen, onModalclose, stock_movement } = props;

    const {
        data: dataStockMovement,
        setData: setDataStockMovement,
        errors: errorsStockMovement,
        processing: processingStockMovement,
        reset: resetStockMovement,

        handleSubmit,
        handleCancel,
    } = useStockMovement(onModalclose);

    useEffect(() => {
        if (item_id) {
            setDataStockMovement('item_id', item_id);
        }
    }, [item_id, setDataStockMovement]);

    useEffect(() => {
        if (stock_movement && isModalOpen) {
            setDataStockMovement({
                remaining_quantity:
                    formatNumber(stock_movement.remaining_quantity) ?? 0,
                unit_cost: formatNumber(stock_movement.unit_cost) ?? 0,
                movement_date: stock_movement.movement_date ?? new Date(),
                notes: stock_movement.notes || '',
            });
        } else {
            resetStockMovement();
        }
    }, [stock_movement, isModalOpen, setDataStockMovement, resetStockMovement]);

    return (
        <Dialog open={isModalOpen} onOpenChange={onModalclose}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {stock_movement
                            ? 'Edit Stock Movement'
                            : 'Tambah Stock Movement'}
                    </DialogTitle>
                    <DialogDescription>
                        {stock_movement
                            ? 'Perbarui informasi perpindahan stok'
                            : 'Isi data detail untuk menambahkan perpindahan stok baru'}
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit(item_id, stock_movement);
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="mb-4">
                            <Label className="text-lg">
                                Perpindahan Stok{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Tambahkan perpindahan stok untuk barang ini.
                            </p>
                        </div>
                    </div>
                    <div className="content input-box mb-4 gap-4 rounded-lg border bg-gray-100 p-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="w-full">
                                <div className="flex flex-col gap-2">
                                    <div className="flex-1">
                                        <Label htmlFor="remaining_quantity">
                                            Sisa Stok{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id="remaining_quantity"
                                            type="text"
                                            step="1"
                                            value={
                                                dataStockMovement.remaining_quantity ??
                                                0
                                            }
                                            onChange={(e) => {
                                                setDataStockMovement(
                                                    'remaining_quantity',
                                                    Number(e.target.value),
                                                );
                                            }}
                                            className="input-box"
                                            disabled={processingStockMovement}
                                        />
                                    </div>
                                    <InputError
                                        message={
                                            errorsStockMovement.remaining_quantity
                                        }
                                    />
                                </div>
                            </div>
                            <div className="w-full">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor={'unit_cost'}>
                                        Unit Cost{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="unit_cost"
                                        type="text"
                                        step="1"
                                        value={dataStockMovement.unit_cost ?? 0}
                                        onChange={(e) => {
                                            setDataStockMovement(
                                                'unit_cost',
                                                Number(e.target.value),
                                            );
                                        }}
                                        className="input-box"
                                        disabled={processingStockMovement}
                                    />
                                    <InputError
                                        message={errorsStockMovement.unit_cost}
                                    />
                                </div>
                            </div>
                            <div className="w-full">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor={'movement_date'}>
                                        Tanggal{' '}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <DatePicker
                                        value={dataStockMovement.movement_date}
                                        onChange={(e) => {
                                            setDataStockMovement(
                                                'movement_date',
                                                e as Date,
                                            );
                                        }}
                                        className="combobox max-w-full min-w-[120px]"
                                    />
                                    <InputError
                                        message={
                                            errorsStockMovement.movement_date
                                        }
                                    />
                                </div>
                            </div>
                            <div className="w-full">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor={'notes'}>Catatan </Label>
                                    <Textarea
                                        id={'notes'}
                                        value={dataStockMovement.notes}
                                        onChange={(e) => {
                                            setDataStockMovement(
                                                'notes',
                                                e.target.value,
                                            );
                                        }}
                                        rows={3}
                                        className="input-box"
                                        disabled={processingStockMovement}
                                    />
                                    <InputError
                                        message={errorsStockMovement.notes}
                                    />
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={handleCancel}
                                            className="btn-secondary"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processingStockMovement}
                                            className="btn-primary"
                                        >
                                            Simpan
                                        </Button>
                                    </DialogFooter>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default StockMovementForm;
