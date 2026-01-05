import { DatePicker } from '@/components/date-picker';
import InputError from '@/components/input-error';
import CityForm from '@/components/master/cities/city-form';
import SupplierForm from '@/components/master/suppliers/supplier-form';
import { AsyncCombobox } from '@/components/ui/async-combobox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import useCity from '@/hooks/use-city';
import usePurchase from '@/hooks/use-purchase';
import { calculateTotals, ItemAccessors } from '@/lib/transaction-calculator';
import {
    formatCurrency,
    formatDiscount,
    formatNumber,
    formatNumberWithSeparator,
} from '@/lib/utils';
import { IItem, IPurchase, IPurchaseDetail, ISupplier, PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { Plus, Trash } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface PurchaseFormProps {
    purchase?: IPurchase;
    items: IItem[];

    supplierOptions: ISupplier[];
}

const PurchaseForm = (props: PurchaseFormProps) => {
    const { purchase, items, supplierOptions } = props;
    const { getCityData } = useCity();
    const { auth } = usePage<PageProps>().props;
    const canEditPrice = auth.permissions.includes('price.edit');

    const [isReady, setIsReady] = useState(false);
    const [cityOptions, setCityOptions] = useState<ComboboxOption[]>([]);
    const [localSuppliers, setLocalSuppliers] =
        useState<ISupplier[]>(supplierOptions);
    const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
    const [isAddCityModalOpen, setIsAddCityModalOpen] = useState(false);
    const [quantityDisplayValues, setQuantityDisplayValues] = useState<
        string[]
    >([]);
    const [priceDisplayValues, setPriceDisplayValues] = useState<string[]>([]);

    useEffect(() => {
        const fetchCityData = async () => {
            const response = await getCityData();
            setCityOptions(response);
        };
        fetchCityData();
    }, [getCityData]);

    const {
        data: dataPurchase,
        setData: setDataPurchase,
        errors: errorsPurchase,
        processing: processingPurchase,
        reset: resetPurchase,

        addItem,
        removeItem,

        handleSubmit: handleSubmitPurchase,
        handleCancel: handleCancelPurchase,
        handleChangeItem,
        handleQuantityChange,
        handlePriceChange,
    } = usePurchase();

    useEffect(() => {
        setLocalSuppliers(supplierOptions);
    }, [supplierOptions]);

    const itemComboboxOptions: ComboboxOption[] = useMemo(() => {
        return items.map((item) => ({
            label: `${item.code} - ${item.name}`,
            value: item.id.toString(),
        }));
    }, [items]);

    const getItemUomComboboxOptions = (
        itemId: number | null,
    ): ComboboxOption[] => {
        if (!itemId) return [];
        const item = items.find((i) => i.id === itemId);
        if (!item || !item.item_uoms) return [];

        return item.item_uoms.map((itemUom) => ({
            label: itemUom.uom.name,
            value: (itemUom.id ?? 0).toString(),
        }));
    };

    const supplierComboboxOptions: ComboboxOption[] = useMemo(() => {
        return localSuppliers.map((supplier) => ({
            label: supplier.name,
            value: supplier.id.toString(),
        }));
    }, [localSuppliers]);

    const calculations = useMemo(() => {
        const detailAccessors: ItemAccessors<IPurchaseDetail> = {
            getQuantity: (detail) => detail.quantity || 0,
            getPrice: (detail) => detail.price || 0,
            getDiscount1Percent: (detail) => detail.discount1_percent || 0,
            getDiscount2Percent: (detail) => detail.discount2_percent || 0,
        };

        return calculateTotals(
            dataPurchase.details,
            detailAccessors,
            dataPurchase.ppn_percent,
        );
    }, [dataPurchase.details, dataPurchase.ppn_percent]);

    useEffect(() => {
        if (purchase) {
            setDataPurchase('supplier_id', purchase.supplier_id);
            setDataPurchase('purchase_date', purchase.purchase_date);
            setDataPurchase('due_date', purchase.due_date ?? null);
            setDataPurchase(
                'ppn_percent',
                formatNumber(purchase.ppn_percent ?? 0),
            );
            setDataPurchase('notes', purchase.notes ?? '');
            setDataPurchase('details', purchase.details);
            const formattedDiscount = purchase.details.map((detail) => ({
                ...detail,
                discount1_percent: formatNumber(detail.discount1_percent ?? 0),
                discount2_percent: formatNumber(detail.discount2_percent ?? 0),
            }));
            setDataPurchase('details', formattedDiscount);

            const formattedQuantity = purchase.details.map((detail) =>
                detail.quantity
                    ? formatNumberWithSeparator(detail.quantity)
                    : '0',
            );
            const formattedPrices = purchase.details.map((detail) =>
                detail.price ? formatNumberWithSeparator(detail.price) : '0',
            );
            setQuantityDisplayValues(formattedQuantity);
            setPriceDisplayValues(formattedPrices);
            setIsReady(true);
        } else {
            resetPurchase();
            setQuantityDisplayValues([]);
            setPriceDisplayValues([]);
            setIsReady(true);
        }
    }, [purchase, setDataPurchase, resetPurchase]);
    if (!isReady) {
        return <Skeleton className="h-full w-full" />;
    }
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                handleSubmitPurchase(purchase);
            }}
            className="space-y-6"
        >
            {/* Header Information */}
            <Card className="content overflow-auto">
                <CardHeader>
                    <CardTitle>Informasi Pembelian</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4 md:flex-row">
                        <div className="flex w-full flex-row items-center justify-start gap-2 md:w-1/2 md:flex-col md:items-baseline md:justify-center">
                            <Label htmlFor="supplier_id">Supplier</Label>
                            <div className="w-full">
                                <AsyncCombobox
                                    initialOptions={supplierComboboxOptions}
                                    value={
                                        dataPurchase.supplier_id
                                            ? dataPurchase.supplier_id.toString()
                                            : ''
                                    }
                                    onValueChange={(value) => {
                                        setDataPurchase(
                                            'supplier_id',
                                            Number(value),
                                        );
                                    }}
                                    onSelect={(option) => {
                                        if (option && option.value) {
                                            const newSupplier =
                                                option as unknown as ISupplier;
                                            setLocalSuppliers((prev) => {
                                                if (
                                                    !prev.find(
                                                        (s) =>
                                                            s.id ===
                                                            newSupplier.id,
                                                    )
                                                ) {
                                                    return [
                                                        ...prev,
                                                        newSupplier,
                                                    ];
                                                }
                                                return prev;
                                            });
                                        }
                                    }}
                                    placeholder="Pilih supplier..."
                                    searchPlaceholder="Cari supplier..."
                                    className="combobox"
                                    searchUrl="/suppliers/search"
                                    searchParam="search"
                                />
                                <InputError
                                    message={errorsPurchase.supplier_id}
                                />
                            </div>
                        </div>
                        <div className="flex flex-row gap-4 md:pr-6">
                            <div className="flex flex-col items-start gap-2">
                                <Label
                                    htmlFor="purchase_date"
                                    className="min-w-35"
                                >
                                    Tanggal Pembelian{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <DatePicker
                                    value={dataPurchase.purchase_date}
                                    onChange={(value) =>
                                        setDataPurchase(
                                            'purchase_date',
                                            value as Date,
                                        )
                                    }
                                    className="input-box"
                                />
                                <InputError
                                    message={errorsPurchase.purchase_date}
                                />
                            </div>
                            <div className="flex flex-col items-start gap-2">
                                <Label htmlFor="due_date" className="min-w-35">
                                    Tanggal Jatuh Tempo
                                </Label>
                                <div className="flex flex-row gap-2">
                                    <DatePicker
                                        value={
                                            dataPurchase.due_date ?? undefined
                                        }
                                        onChange={(value) =>
                                            setDataPurchase(
                                                'due_date',
                                                value as Date,
                                            )
                                        }
                                        className="input-box"
                                    />
                                    {dataPurchase.due_date && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                setDataPurchase(
                                                    'due_date',
                                                    null,
                                                )
                                            }
                                            className="btn-danger"
                                        >
                                            Hapus
                                        </Button>
                                    )}
                                </div>
                                <InputError message={errorsPurchase.due_date} />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="content">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Detail Barang</CardTitle>
                        <Button
                            type="button"
                            onClick={addItem}
                            size="sm"
                            className="btn-primary"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Item
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="input-box overflow-x-auto rounded-lg">
                        <Table className="content">
                            <TableHeader>
                                <TableRow className="dark:border-b-2 dark:border-white/25">
                                    <TableHead className="min-w-[300px] text-center">
                                        Item
                                    </TableHead>
                                    <TableHead className="min-w-[150px] text-center">
                                        UOM
                                    </TableHead>
                                    <TableHead className="min-w-[125px] text-center">
                                        Kuantitas
                                    </TableHead>
                                    <TableHead className="min-w-[180px] text-center">
                                        Harga
                                    </TableHead>
                                    <TableHead className="min-w-[80px] text-center">
                                        Disc 1 (%)
                                    </TableHead>
                                    <TableHead className="min-w-[80px] text-center">
                                        Disc 2 (%)
                                    </TableHead>
                                    <TableHead className="min-w-[200px] text-center">
                                        Subtotal
                                    </TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dataPurchase.details.map((detail, index) => {
                                    const uomOptions =
                                        getItemUomComboboxOptions(
                                            Number(detail.item_id),
                                        );
                                    return (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Combobox
                                                    options={
                                                        itemComboboxOptions
                                                    }
                                                    value={
                                                        detail?.item_id
                                                            ? detail?.item_id?.toString()
                                                            : ''
                                                    }
                                                    onValueChange={(value) => {
                                                        handleChangeItem(
                                                            index,
                                                            'item_id',
                                                            Number(value),
                                                        );
                                                        // Reset UOM when item changes
                                                        handleChangeItem(
                                                            index,
                                                            'item_uom_id',
                                                            0,
                                                        );
                                                    }}
                                                    placeholder="Pilih item..."
                                                    searchPlaceholder="Cari item..."
                                                    className="combobox"
                                                />
                                                <InputError
                                                    message={
                                                        (
                                                            errorsPurchase as Record<
                                                                string,
                                                                string
                                                            >
                                                        )[
                                                        `details[${index}].item_id`
                                                        ]
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Combobox
                                                    options={uomOptions}
                                                    value={
                                                        detail.item_uom_id &&
                                                            detail.item_uom_id > 0
                                                            ? detail.item_uom_id.toString()
                                                            : ''
                                                    }
                                                    onValueChange={(value) => {
                                                        handleChangeItem(
                                                            index,
                                                            'item_uom_id',
                                                            Number(value),
                                                        );
                                                    }}
                                                    disabled={
                                                        !detail.item_id ||
                                                        uomOptions.length === 0
                                                    }
                                                    placeholder="Pilih UOM..."
                                                    searchPlaceholder="Cari UOM..."
                                                    className="combobox"
                                                />
                                                <InputError
                                                    message={
                                                        (
                                                            errorsPurchase as Record<
                                                                string,
                                                                string
                                                            >
                                                        )[
                                                        `details[${index}].item_uom_id`
                                                        ]
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="text"
                                                    value={
                                                        quantityDisplayValues[
                                                        index
                                                        ] ?? '0'
                                                    }
                                                    onChange={(e) => {
                                                        handleQuantityChange(
                                                            index,
                                                            e,
                                                            quantityDisplayValues,
                                                            setQuantityDisplayValues,
                                                        );
                                                    }}
                                                    className="input-box text-right"
                                                />
                                                <InputError
                                                    message={
                                                        (
                                                            errorsPurchase as Record<
                                                                string,
                                                                string
                                                            >
                                                        )[
                                                        `details[${index}].quantity`
                                                        ]
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="text"
                                                    value={
                                                        priceDisplayValues[
                                                        index
                                                        ] ?? '0'
                                                    }
                                                    onChange={(e) => {
                                                        handlePriceChange(
                                                            index,
                                                            e,
                                                            priceDisplayValues,
                                                            setPriceDisplayValues,
                                                        );
                                                    }}
                                                    className="input-box text-right"
                                                    disabled={!canEditPrice}
                                                />
                                                <InputError
                                                    message={
                                                        (
                                                            errorsPurchase as Record<
                                                                string,
                                                                string
                                                            >
                                                        )[
                                                        `details[${index}].price`
                                                        ]
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="text"
                                                    value={
                                                        detail.discount1_percent
                                                    }
                                                    onChange={(e) => {
                                                        const value =
                                                            formatDiscount(
                                                                e.target.value,
                                                            );

                                                        handleChangeItem(
                                                            index,
                                                            'discount1_percent',
                                                            value,
                                                        );
                                                    }}
                                                    className="input-box text-right"
                                                    disabled={!canEditPrice}
                                                />
                                                <InputError
                                                    message={
                                                        (
                                                            errorsPurchase as Record<
                                                                string,
                                                                string
                                                            >
                                                        )[
                                                        `details[${index}].discount1_percent`
                                                        ]
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="text"
                                                    value={
                                                        detail.discount2_percent
                                                    }
                                                    onChange={(e) => {
                                                        const value =
                                                            formatDiscount(
                                                                e.target.value,
                                                            );

                                                        handleChangeItem(
                                                            index,
                                                            'discount2_percent',
                                                            value,
                                                        );
                                                    }}
                                                    className="input-box text-right"
                                                    disabled={!canEditPrice}
                                                />
                                                <InputError
                                                    message={
                                                        (
                                                            errorsPurchase as Record<
                                                                string,
                                                                string
                                                            >
                                                        )[
                                                        `details[${index}].discount2_percent`
                                                        ]
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell className="text-center font-medium">
                                                {formatCurrency(
                                                    calculations.subtotal || 0,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        removeItem(index)
                                                    }
                                                    disabled={
                                                        dataPurchase.details
                                                            .length === 1
                                                    }
                                                    className="btn-trash"
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Totals & Footer */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="content">
                    <CardHeader>
                        <CardTitle>Pajak & Catatan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="ppn_percent">PPN %</Label>
                            <Input
                                id="ppn_percent"
                                type="text"
                                value={dataPurchase.ppn_percent}
                                onChange={(e) => {
                                    const value = formatDiscount(
                                        e.target.value,
                                    );
                                    setDataPurchase('ppn_percent', value);
                                }}
                                className="input-box text-right"
                                disabled={!canEditPrice}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Catatan</Label>
                            <Textarea
                                id="notes"
                                value={dataPurchase.notes}
                                onChange={(e) =>
                                    setDataPurchase('notes', e.target.value)
                                }
                                rows={4}
                                className="input-box"
                            />
                        </div>
                        <div className="space-y-2 border-t pt-2">
                            <div className="text-sm text-muted-foreground">
                                💡 <strong>Info:</strong> Diskon header otomatis
                                dihitung dari total diskon semua items
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="content">
                    <CardHeader>
                        <CardTitle>Total Pembelian</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                Subtotal (sebelum diskon):
                            </span>
                            <span className="font-medium">
                                {formatCurrency(calculations.subtotal)}
                            </span>
                        </div>
                        {calculations.totalDiscount1Amount > 0 && (
                            <div className="flex justify-between text-sm text-red-600 dark:text-danger-400">
                                <span>Total Diskon 1 (dari items):</span>
                                <span>
                                    -
                                    {formatCurrency(
                                        calculations.totalDiscount1Amount,
                                    )}
                                </span>
                            </div>
                        )}
                        {calculations.totalDiscount2Amount > 0 && (
                            <div className="flex justify-between text-sm text-red-600 dark:text-danger-400">
                                <span>Total Diskon 2 (dari items):</span>
                                <span>
                                    -
                                    {formatCurrency(
                                        calculations.totalDiscount2Amount,
                                    )}
                                </span>
                            </div>
                        )}
                        {calculations.ppnAmount > 0 && (
                            <div className="flex justify-between text-sm text-blue-600 dark:text-primary-700">
                                <span>PPN ({dataPurchase.ppn_percent}%):</span>
                                <span>
                                    +{formatCurrency(calculations.ppnAmount)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between border-t-2 pt-3 text-lg font-bold dark:border-gray-500">
                            <span className="uppercase">Grand Total:</span>
                            <span className="text-primary">
                                {formatCurrency(calculations.grandTotal)}
                            </span>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleCancelPurchase}
                                disabled={processingPurchase}
                                className="btn-secondary flex-1"
                            >
                                Reset
                            </Button>
                            <Button
                                type="submit"
                                disabled={processingPurchase}
                                className="btn-primary flex-1"
                            >
                                {processingPurchase
                                    ? 'Menyimpan...'
                                    : purchase
                                        ? 'Update'
                                        : 'Simpan'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dialog for adding new supplier */}
            <SupplierForm
                isModalOpen={isAddSupplierModalOpen}
                onModalClose={() => setIsAddSupplierModalOpen(false)}
                cityComboboxOption={cityOptions}
            />

            {/* Dialog for adding new city */}
            <CityForm
                isModalOpen={isAddCityModalOpen}
                onModalClose={() => setIsAddCityModalOpen(false)}
            />
        </form>
    );
};

export default PurchaseForm;
