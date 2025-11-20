import { DatePicker } from '@/components/date-picker';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import useStockAdjustment from '@/hooks/use-stock-adjustment';
import { formatCurrency, formatNumberWithSeparator, parseStringtoNumber } from '@/lib/utils';
import { IItem } from '@/types';
import { Dialog } from '@radix-ui/react-dialog';
import { useEffect, useMemo, useState } from 'react';

interface StockAdjustmentFormProps {
    isModalOpen: boolean;
    onModalClose: () => void;
    items?: IItem[];
}

const StockAdjustmentForm = (props: StockAdjustmentFormProps) => {
    const { isModalOpen, onModalClose, items = [] } = props;

    const {
        data,
        setData,
        errors,
        processing,
        reset,
        handleSubmit,
        handleCancel,
    } = useStockAdjustment(onModalClose);

    const [selectedItem, setSelectedItem] = useState<IItem | null>(null);
    const [quantityDisplay, setQuantityDisplay] = useState('');
    const [unitCostDisplay, setUnitCostDisplay] = useState('');

    const itemOptions: ComboboxOption[] = useMemo(() => {
        if (!items || !Array.isArray(items)) {
            return [];
        }
        return items.map((item) => ({
            value: item.id.toString(),
            label: `${item.code || ''} - ${item.name}`.trim(),
        }));
    }, [items]);

    useEffect(() => {
        if (isModalOpen) {
            reset();
            setSelectedItem(null);
            setQuantityDisplay('');
            setUnitCostDisplay('');
        }
    }, [isModalOpen, reset]);

    useEffect(() => {
        if (data.item_id) {
            const item = items.find((i) => i.id === Number(data.item_id));
            setSelectedItem(item || null);
            if (item && !data.unit_cost) {
                setData('unit_cost', item.modal_price || 0);
                setUnitCostDisplay(formatCurrency(item.modal_price || 0));
            }
        } else {
            setSelectedItem(null);
        }
    }, [data.item_id, items, data.unit_cost, setData]);

    const handleItemChange = (value: string) => {
        setData('item_id', value ? Number(value) : '');
        const item = items.find((i) => i.id === Number(value));
        if (item) {
            setSelectedItem(item);
            if (!data.unit_cost) {
                setData('unit_cost', item.modal_price || 0);
                setUnitCostDisplay(formatCurrency(item.modal_price || 0));
            }
        }
    };

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuantityDisplay(value);
        const parsed = parseStringtoNumber(value);
        setData('quantity', parsed !== null ? parsed : '');
    };

    const handleUnitCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setUnitCostDisplay(value);
        const parsed = parseStringtoNumber(value);
        setData('unit_cost', parsed !== null ? parsed : '');
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={onModalClose}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Tambah Penyesuaian Stok</DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmit();
                    }}
                >
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="item_id" required>
                                Barang
                            </Label>
                            <Combobox
                                options={itemOptions}
                                value={data.item_id ? data.item_id.toString() : ''}
                                onValueChange={handleItemChange}
                                placeholder="Pilih barang"
                            />
                            <InputError message={errors.item_id} />
                            {selectedItem && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Stok saat ini: {formatNumberWithSeparator(selectedItem.stock || 0)}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="quantity" required>
                                    Jumlah Penyesuaian
                                </Label>
                                <Input
                                    id="quantity"
                                    type="text"
                                    value={quantityDisplay}
                                    onChange={handleQuantityChange}
                                    placeholder="Masukkan jumlah (positif untuk tambah, negatif untuk kurangi)"
                                    className="input-box"
                                />
                                <InputError message={errors.quantity} />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Gunakan tanda minus (-) untuk mengurangi stok
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="unit_cost">
                                    Harga Satuan
                                </Label>
                                <Input
                                    id="unit_cost"
                                    type="text"
                                    value={unitCostDisplay}
                                    onChange={handleUnitCostChange}
                                    placeholder="Masukkan harga satuan"
                                    className="input-box"
                                />
                                <InputError message={errors.unit_cost} />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="adjustment_date" required>
                                Tanggal Penyesuaian
                            </Label>
                            <DatePicker
                                value={data.adjustment_date}
                                onChange={(date) => setData('adjustment_date', date as Date)}
                                className="combobox max-w-full"
                            />
                            <InputError message={errors.adjustment_date} />
                        </div>

                        <div>
                            <Label htmlFor="notes">Catatan</Label>
                            <Textarea
                                id="notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows={3}
                                className="input-box"
                                placeholder="Masukkan catatan (opsional)"
                            />
                            <InputError message={errors.notes} />
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCancel}
                            className="btn-secondary"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="btn-primary"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default StockAdjustmentForm;

