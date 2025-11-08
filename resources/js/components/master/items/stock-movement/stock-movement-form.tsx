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
import { IItemStockMovement } from '@/types';
import { Dialog, DialogDescription } from '@radix-ui/react-dialog';
import { Plus, X } from 'lucide-react';
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

        addStockMovement,
        removeStockMovement,

        handleSubmit,
        handleCancel,
        handleChangeStockMovement,
    } = useStockMovement(onModalclose);

    useEffect(() => {
        if (item_id) {
            setDataStockMovement('item_id', item_id);
        }
    }, [item_id, setDataStockMovement]);

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
                        <Button
                            type="button"
                            onClick={addStockMovement}
                            size="sm"
                            className="btn-primary"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Perpindahan Stock
                        </Button>
                    </div>

                    <div className="input-box flex w-full flex-col rounded-lg border p-4">
                        {dataStockMovement.stock_movements.map(
                            (stock, index) => (
                                <div className="content input-box mb-4 gap-4 rounded-lg border bg-gray-100 p-3">
                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            onClick={() =>
                                                removeStockMovement(index)
                                            }
                                            size="sm"
                                            className="btn-trash"
                                        >
                                            <X />
                                        </Button>
                                    </div>
                                    <div
                                        key={index}
                                        className="grid grid-cols-2 gap-4"
                                    >
                                        <div className="w-full">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex-1">
                                                    <Label
                                                        htmlFor={`remaining_quantity_${index}`}
                                                    >
                                                        Sisa Stok{' '}
                                                        <span className="text-red-500">
                                                            *
                                                        </span>
                                                    </Label>
                                                    <Input
                                                        id={`remaingin_quantity_${index}`}
                                                        type="text"
                                                        step="1"
                                                        value={
                                                            stock.remaining_quantity ??
                                                            0
                                                        }
                                                        onChange={(e) => {
                                                            handleChangeStockMovement(
                                                                index,
                                                                'remaining_quantity',
                                                                Number(
                                                                    e.target
                                                                        .value,
                                                                )
                                                                    ? Number(
                                                                          e
                                                                              .target
                                                                              .value,
                                                                      )
                                                                    : 0,
                                                            );
                                                        }}
                                                        className="input-box"
                                                        disabled={
                                                            processingStockMovement
                                                        }
                                                    />
                                                </div>
                                                <InputError
                                                    message={
                                                        (
                                                            errorsStockMovement as Record<
                                                                string,
                                                                string
                                                            >
                                                        )[
                                                            `stock_movements[${index}].remaining_quantity`
                                                        ]
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div className="w-full">
                                            <div className="flex flex-col gap-2">
                                                <Label
                                                    htmlFor={`conversion_${index}`}
                                                >
                                                    Unit Cost{' '}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </Label>
                                                <Input
                                                    id={`unit_cost_${index}`}
                                                    type="text"
                                                    step="1"
                                                    value={stock.unit_cost ?? 0}
                                                    onChange={(e) => {
                                                        handleChangeStockMovement(
                                                            index,
                                                            'unit_cost',
                                                            Number(
                                                                e.target.value,
                                                            )
                                                                ? Number(
                                                                      e.target
                                                                          .value,
                                                                  )
                                                                : 0,
                                                        );
                                                    }}
                                                    className="input-box"
                                                    disabled={
                                                        processingStockMovement
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        (
                                                            errorsStockMovement as Record<
                                                                string,
                                                                string
                                                            >
                                                        )[
                                                            `stock_movements[${index}].unit_cost`
                                                        ]
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div className="w-full">
                                            <div className="flex flex-col gap-2">
                                                <Label
                                                    htmlFor={`movement_date_${index}`}
                                                >
                                                    Tanggal{' '}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </Label>
                                                <DatePicker
                                                    value={stock.movement_date}
                                                    onChange={(date) => {
                                                        handleChangeStockMovement(
                                                            index,
                                                            'movement_date',
                                                            date,
                                                        );
                                                    }}
                                                    className="combobox max-w-full min-w-[120px]"
                                                />
                                            </div>
                                        </div>
                                        <div className="w-full">
                                            <div className="flex flex-col gap-2">
                                                <Label
                                                    htmlFor={`notes${index}`}
                                                >
                                                    Catatan{' '}
                                                </Label>
                                                <Textarea
                                                    id={`notes_${index}`}
                                                    value={stock.notes}
                                                    onChange={(e) => {
                                                        handleChangeStockMovement(
                                                            index,
                                                            'notes',
                                                            e.target.value,
                                                        );
                                                    }}
                                                    rows={3}
                                                    className="input-box"
                                                    disabled={
                                                        processingStockMovement
                                                    }
                                                />
                                                <InputError
                                                    message={
                                                        (
                                                            errorsStockMovement as Record<
                                                                string,
                                                                string
                                                            >
                                                        )[
                                                            `stock_movements[${index}].notes`
                                                        ]
                                                    }
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
                                                        disabled={
                                                            processingStockMovement
                                                        }
                                                        className="btn-primary"
                                                    >
                                                        Simpan
                                                    </Button>
                                                </DialogFooter>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default StockMovementForm;
