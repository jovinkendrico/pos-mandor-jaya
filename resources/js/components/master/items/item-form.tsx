import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { store, update } from '@/routes/items';
import { useForm } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ItemUom {
    id?: number;
    uom_name: string;
    conversion_value: number | string;
    price: string;
    is_base: boolean;
}

interface Item {
    id: number;
    code: string;
    name: string;
    base_uom: string;
    stock: string;
    description?: string;
    uoms?: ItemUom[];
}

interface ItemFormProps {
    item?: Item | null;
    isModalOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export default function ItemForm({
    item,
    isModalOpen,
    onOpenChange,
}: ItemFormProps) {
    const form = useForm<{
        code: string;
        name: string;
        base_uom: string;
        stock: string;
        modal_price: string; // NEW FIELD FOR COST HPP
        description: string;
        uoms: ItemUom[];
    }>({
        code: '',
        name: '',
        base_uom: '',
        stock: '0',
        modal_price: '', // INIT
        description: '',
        uoms: [],
    });

    const [uoms, setUoms] = useState<ItemUom[]>([
        {
            uom_name: '',
            conversion_value: 1,
            price: '0',
            is_base: true,
        },
    ]);

    useEffect(() => {
        if (isModalOpen) {
            if (item) {
                // Edit mode - convert UOMs untuk ensure tipe data benar
                const normalizedUoms = (item.uoms || []).map((uom) => ({
                    ...uom,
                    conversion_value:
                        typeof uom.conversion_value === 'string'
                            ? parseInt(uom.conversion_value) || 1
                            : uom.conversion_value,
                    price: String(uom.price),
                }));

                form.setData({
                    code: item.code,
                    name: item.name,
                    base_uom: item.base_uom,
                    stock: item.stock,
                    description: item.description || '',
                    uoms: normalizedUoms,
                });
                setUoms(normalizedUoms);
            } else {
                // Create mode - reset form
                form.reset();
                setUoms([
                    {
                        uom_name: '',
                        conversion_value: 1,
                        price: '0',
                        is_base: true,
                    },
                ]);
            }
        }
    }, [item, isModalOpen]);

    const handleAddUom = () => {
        setUoms([
            ...uoms,
            {
                uom_name: '',
                conversion_value: 1,
                price: '0',
                is_base: false,
            },
        ]);
    };

    const handleRemoveUom = (index: number) => {
        if (uoms.length === 1) {
            toast.error('Minimal harus ada 1 UOM');
            return;
        }

        // Jika yang dihapus adalah base UOM, set UOM pertama jadi base
        const newUoms = uoms.filter((_, i) => i !== index);
        if (uoms[index].is_base && newUoms.length > 0) {
            newUoms[0].is_base = true;
        }
        setUoms(newUoms);
    };

    const handleUomChange = (
        index: number,
        field: keyof ItemUom,
        value: string | boolean | number,
    ) => {
        const newUoms = [...uoms];
        if (field === 'is_base' && value === true) {
            // Set semua UOM jadi bukan base
            newUoms.forEach((uom) => (uom.is_base = false));
        }

        // Convert to number for conversion_value
        if (field === 'conversion_value') {
            const numValue = parseInt(value as string);
            newUoms[index] = {
                ...newUoms[index],
                [field]: isNaN(numValue) ? 1 : numValue,
            };
        } else {
            newUoms[index] = { ...newUoms[index], [field]: value };
        }
        setUoms(newUoms);
    };

    const handleSetBaseUom = (index: number) => {
        const newUoms = uoms.map((uom, i) => ({
            ...uom,
            is_base: i === index,
        }));
        setUoms(newUoms);

        // Update base_uom field
        form.setData('base_uom', newUoms[index].uom_name);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validasi minimal 1 UOM
        if (uoms.length === 0) {
            toast.error('Minimal harus ada 1 UOM');
            return;
        }

        // Validasi semua UOM terisi
        const hasEmptyUom = uoms.some((uom) => {
            const convValue =
                typeof uom.conversion_value === 'string'
                    ? parseInt(uom.conversion_value)
                    : uom.conversion_value;
            return (
                !uom.uom_name.trim() ||
                !uom.conversion_value ||
                convValue < 1 ||
                !uom.price
            );
        });
        if (hasEmptyUom) {
            toast.error('Semua field UOM harus diisi lengkap dan valid');
            return;
        }

        // Validasi ada base UOM
        const hasBaseUom = uoms.some((uom) => uom.is_base);
        if (!hasBaseUom) {
            toast.error('Harus ada 1 UOM sebagai base UOM');
            return;
        }

        // Set base_uom dari UOM yang is_base
        const baseUom = uoms.find((uom) => uom.is_base);

        // Normalize UOMs - ensure tipe data benar untuk backend
        const normalizedUoms = uoms.map((uom) => ({
            uom_name: uom.uom_name.trim(),
            conversion_value:
                typeof uom.conversion_value === 'string'
                    ? parseInt(uom.conversion_value)
                    : uom.conversion_value,
            price:
                typeof uom.price === 'string' ? uom.price : String(uom.price),
            is_base: uom.is_base,
        }));

        // Update form data sebelum submit
        form.setData({
            ...form.data,
            base_uom: baseUom?.uom_name || '',
            uoms: normalizedUoms,
        });

        if (item) {
            form.transform((data) => ({
                ...data,
                uoms: normalizedUoms,
            }));

            form.put(update(item.id).url, {
                onSuccess: () => {
                    toast.success('Barang berhasil diperbarui');
                    onOpenChange(false);
                },
                onError: (errors: unknown) => {
                    console.error('Validation errors:', errors);
                    const errorMessages = Object.values(errors).flat();
                    errorMessages.forEach((message) => {
                        toast.error(message as string);
                    });
                },
            });
        } else {
            form.transform((data) => ({
                ...data,
                uoms: normalizedUoms,
            }));

            form.post(store().url, {
                onSuccess: () => {
                    toast.success('Barang berhasil ditambahkan');
                    onOpenChange(false);
                },
                onError: (errors: unknown) => {
                    console.error('Validation errors:', errors);
                    const errorMessages = Object.values(errors).flat();
                    errorMessages.forEach((message) => {
                        toast.error(message as string);
                    });
                },
            });
        }
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {item ? 'Edit Barang' : 'Tambah Barang'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="code">
                                Kode Barang{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="code"
                                value={form.data.code}
                                onChange={(e) =>
                                    form.setData('code', e.target.value)
                                }
                                placeholder="Contoh: BRG001"
                                required
                                disabled={form.processing}
                            />
                            <InputError message={form.errors.code} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Nama Barang{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                                placeholder="Contoh: Paku 5cm"
                                required
                                disabled={form.processing}
                            />
                            <InputError message={form.errors.name} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="modal_price">
                                Harga Modal / HPP <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="modal_price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.data.modal_price}
                                onChange={(e) => form.setData('modal_price', e.target.value)}
                                placeholder="0"
                                required={parseFloat(form.data.stock) > 0}
                                disabled={form.processing}
                            />
                            <InputError message={form.errors.modal_price} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="stock">
                                Stock (dalam Base UOM)
                            </Label>
                            <Input
                                id="stock"
                                type="number"
                                step="0.01"
                                value={form.data.stock}
                                onChange={(e) =>
                                    form.setData('stock', e.target.value)
                                }
                                placeholder="0"
                                disabled={form.processing}
                            />
                            <InputError message={form.errors.stock} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Deskripsi</Label>
                            <Textarea
                                id="description"
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                                placeholder="Deskripsi barang..."
                                disabled={form.processing}
                            />
                            <InputError message={form.errors.description} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-lg">
                                    Unit of Measure (UOM){' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Tambahkan satuan untuk barang ini. Klik
                                    badge "Base" untuk set UOM dasar.
                                </p>
                            </div>
                            <Button
                                type="button"
                                onClick={handleAddUom}
                                size="sm"
                                variant="outline"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Tambah UOM
                            </Button>
                        </div>

                        <div className="space-y-3 rounded-lg border p-4">
                            {uoms.map((uom, index) => (
                                <div
                                    key={index}
                                    className="grid items-end gap-3 rounded-lg border bg-muted/50 p-3 md:grid-cols-[2fr_1.5fr_1.5fr_auto_auto]"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor={`uom_name_${index}`}>
                                            Nama UOM{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Input
                                            id={`uom_name_${index}`}
                                            value={uom.uom_name}
                                            onChange={(e) =>
                                                handleUomChange(
                                                    index,
                                                    'uom_name',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="PCS, Kotak, KG, dll"
                                            required
                                            disabled={form.processing}
                                        />
                                    </div>

                                    <div className="space-y-2">
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
                                            onChange={(e) =>
                                                handleUomChange(
                                                    index,
                                                    'conversion_value',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="1"
                                            required
                                            disabled={
                                                form.processing || uom.is_base
                                            }
                                        />
                                    </div>

                                    <div className="space-y-2">
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
                                            onChange={(e) =>
                                                handleUomChange(
                                                    index,
                                                    'price',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="0"
                                            required
                                            disabled={form.processing}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={
                                                uom.is_base
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            className="cursor-pointer"
                                            onClick={() =>
                                                handleSetBaseUom(index)
                                            }
                                        >
                                            {uom.is_base ? 'Base' : 'Set Base'}
                                        </Badge>
                                    </div>

                                    <Button
                                        type="button"
                                        onClick={() => handleRemoveUom(index)}
                                        size="icon"
                                        variant="ghost"
                                        className="text-red-500 hover:bg-red-50 hover:text-red-700"
                                        disabled={
                                            form.processing || uoms.length === 1
                                        }
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-1 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-muted-foreground">
                            <p className="font-semibold text-blue-900">
                                💡 <strong>Panduan Multi-UOM:</strong>
                            </p>
                            <ul className="ml-4 list-inside list-disc space-y-1 text-blue-800">
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
                                <li>Stock selalu dihitung dalam Base UOM</li>
                                <li>Base UOM selalu punya konversi = 1</li>
                            </ul>
                            <p className="mt-2 font-medium text-blue-900">
                                📦 Jika stock 10.000 PCS = 100 Kotak = 20 KG
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => onOpenChange(false)}
                            disabled={form.processing}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing
                                ? 'Menyimpan...'
                                : item
                                  ? 'Update'
                                  : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
