import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import useItem from '@/hooks/use-item';
import { cn } from '@/lib/utils';
import { IItem, IUOM } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import UOMForm from '../uom/uom-form';

interface ItemFormProps {
    isModalOpen: boolean;
    onModalClose: () => void;
    item?: IItem | undefined;
    uomOptions: IUOM[];
}

const ItemForm = (props: ItemFormProps) => {
    const { item, uomOptions, isModalOpen, onModalClose } = props;

    const [localUOMS, setLocalUOMS] = useState<IUOM[]>(uomOptions);
    const [isAddUOMModalOpen, setIsAddUOMModalOpen] = useState(false);

    const {
        data: dataItem,
        setData: setDataItem,
        errors: errorsItem,
        processing: processingItem,

        addUOM,
        removeUOM,

        handleSubmit: handleSubmitItem,
        handleCancel: handleCancelItem,
        handleChangeItem,
    } = useItem(onModalClose);

    useMemo(() => {
        setLocalUOMS(uomOptions);
    }, [uomOptions]);

    const uomComboBoxOptions: ComboboxOption[] = useMemo(() => {
        return localUOMS.map((uom) => ({
            value: uom.id.toString(),
            label: uom.name,
        }));
    }, [localUOMS]);

    return (
        <Dialog open={isModalOpen} onOpenChange={onModalClose}>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {item ? 'Edit Barang' : 'Tambah Barang'}
                    </DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmitItem(item);
                    }}
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <Label htmlFor="name" required>
                                Nama Barang{' '}
                            </Label>
                            <Input
                                id="name"
                                value={dataItem.name}
                                onChange={(e) =>
                                    setDataItem('name', e.target.value)
                                }
                                placeholder="Cth: Paku 5cm"
                                disabled={processingItem}
                                className="input-box"
                            />
                            {errorsItem.name && (
                                <InputError message={errorsItem.name} />
                            )}
                        </div>

                        <div>
                            <Label htmlFor="stock">Stok (dalam Base UOM)</Label>
                            <Input
                                id="stock"
                                type="number"
                                value={dataItem.stock ?? 0}
                                onChange={(e) =>
                                    setDataItem(
                                        'stock',
                                        Number(e.target.value)
                                            ? Number(e.target.value)
                                            : 0,
                                    )
                                }
                                placeholder="Cth: 100"
                                disabled={processingItem}
                                className="input-box"
                            />
                            {errorsItem.stock && (
                                <InputError message={errorsItem.stock} />
                            )}
                        </div>

                        <div>
                            <Label htmlFor="description">Deskripsi</Label>
                            <Textarea
                                id="description"
                                value={dataItem.description}
                                onChange={(e) =>
                                    setDataItem('description', e.target.value)
                                }
                                rows={3}
                                disabled={processingItem}
                                className="input-box"
                            />
                            {errorsItem.description && (
                                <InputError message={errorsItem.description} />
                            )}
                        </div>
                    </div>

                    <div className="my-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-lg">
                                    Unit of Measure (UOM){' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Tambahkan satuan untuk barang ini. Klik opsi
                                    "Base" untuk menjadikan UOM sebagai dasar.
                                </p>
                            </div>
                            <Button
                                type="button"
                                onClick={addUOM}
                                size="sm"
                                variant="secondary"
                                className="btn-secondary"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah UOM
                            </Button>
                        </div>

                        <div className="input-box flex w-full flex-col rounded-lg border p-4">
                            {dataItem.uoms.map((uom, index) => (
                                <div
                                    key={index}
                                    className="content input-box mb-4 flex flex-row items-center gap-4 rounded-lg border bg-gray-100 p-3"
                                >
                                    <div>
                                        <Label htmlFor={`uom_name_${index}`}>
                                            Nama UOM{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <div className="flex w-full flex-row items-center justify-between gap-2">
                                            <Combobox
                                                options={uomComboBoxOptions}
                                                value={
                                                    uom.uom.id?.toString() || ''
                                                }
                                                onValueChange={(newValue) => {
                                                    const setSelectedUOM =
                                                        uomOptions.find(
                                                            (u) =>
                                                                u.id.toString() ===
                                                                newValue,
                                                        );
                                                    if (!setSelectedUOM) {
                                                        return;
                                                    }
                                                    handleChangeItem(
                                                        index,
                                                        'uom.id',
                                                        Number(newValue),
                                                    );
                                                    handleChangeItem(
                                                        index,
                                                        'uom.name',
                                                        setSelectedUOM.name,
                                                    );
                                                }}
                                                placeholder="Pilih atau cari UOM..."
                                                searchPlaceholder="Cari UOM"
                                                emptyText="UOM tidak ditemukan"
                                                className="dark:!bg-white dark:!text-primary-200"
                                                disabled={processingItem}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() =>
                                                    setIsAddUOMModalOpen(true)
                                                }
                                                title="Tambah UOM baru"
                                                className="btn-secondary"
                                            >
                                                <Plus className="text-center" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor={`conversion_${index}`}>
                                            Konversi ke Base{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id={`conversion_${index}`}
                                            type="number"
                                            step="1"
                                            min="1"
                                            value={uom.conversion_value}
                                            onChange={(e) => {
                                                if (!uom.is_base) {
                                                    handleChangeItem(
                                                        index,
                                                        'conversion_value',
                                                        Number(e.target.value),
                                                    );
                                                } else {
                                                    handleChangeItem(
                                                        index,
                                                        'conversion_value',
                                                        1,
                                                    );
                                                }
                                            }}
                                            className="input-box"
                                            required
                                            disabled={
                                                processingItem || uom.is_base
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor={`price_${index}`}>
                                            Harga{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id={`price_${index}`}
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={uom.price}
                                            onChange={(e) => {
                                                handleChangeItem(
                                                    index,
                                                    'price',
                                                    Number(e.target.value),
                                                );
                                            }}
                                            placeholder="0"
                                            required
                                            disabled={undefined}
                                            className="input-box"
                                        />
                                    </div>

                                    <div className="flex items-center justify-center gap-4">
                                        <Badge
                                            variant={
                                                uom.is_base
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            className={cn(
                                                'cursor-pointer rounded-3xl',
                                                uom.is_base
                                                    ? 'badge-green-light'
                                                    : 'badge-gray-light',
                                            )}
                                            onClick={() => {
                                                handleChangeItem(
                                                    index,
                                                    'is_base',
                                                    !uom.is_base,
                                                );
                                            }}
                                        >
                                            {uom.is_base ? 'Base' : 'Set Base'}
                                        </Badge>
                                        <Button
                                            type="button"
                                            onClick={() => removeUOM(index)}
                                            size="icon"
                                            variant="ghost"
                                            className="btn-trash"
                                            disabled={undefined}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="my-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-muted-foreground">
                            <p className="font-semibold text-blue-900">
                                💡 <strong>Panduan Multi-UOM:</strong>
                            </p>
                            <ul className="ml-4 list-inside list-disc text-blue-800">
                                <li>
                                    <strong>Base UOM = Satuan TERKECIL</strong>{' '}
                                    (bukan terbesar)
                                </li>
                                <li>
                                    Contoh: Base UOM = <strong>PCS</strong> (1
                                    pcs = unit terkecil)
                                </li>
                                <li>Kotak = 100 PCS → Konversi = 100</li>
                                <li>KG = 500 PCS → Konversi = 500</li>
                                <li>Stok selalu dihitung dalam Base UOM</li>
                                <li>Base UOM selalu punya konversi = 1</li>
                            </ul>
                            <p className="mt-2 font-medium text-blue-900">
                                📦 Jika stok 10.000 PCS = 100 Kotak = 20 KG
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCancelItem}
                            disabled={processingItem}
                            className="btn-secondary"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={processingItem}
                            className="btn-primary"
                        >
                            {processingItem
                                ? 'Menyimpan...'
                                : item
                                  ? 'Update'
                                  : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
            <UOMForm
                isModalOpen={isAddUOMModalOpen}
                onModalClose={() => setIsAddUOMModalOpen(false)}
                isNested
            />
        </Dialog>
    );
};

export default ItemForm;
