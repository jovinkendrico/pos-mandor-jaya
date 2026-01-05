import { DatePicker } from '@/components/date-picker';
import InputError from '@/components/input-error';
import CityForm from '@/components/master/cities/city-form';
import CustomerForm from '@/components/master/customers/customer-form';
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
import useSale from '@/hooks/use-sale';
import { calculateTotals, ItemAccessors } from '@/lib/transaction-calculator';
import {
    formatCurrency,
    formatDiscount,
    formatNumber,
    formatNumberWithSeparator,
} from '@/lib/utils';
import { ICustomer, IItem, ISale, ISaleDetail } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface SaleFormProps {
    sale?: ISale;
    items: IItem[];

    customerOptions: ICustomer[];
}

const SaleForm = (props: SaleFormProps) => {
    const { sale, items, customerOptions } = props;
    const { getCityData } = useCity();

    const [isReady, setIsReady] = useState(false);
    const [cityOptions, setCityOptions] = useState<ComboboxOption[]>([]);
    const [localCustomers, setLocalCustomers] =
        useState<ICustomer[]>(customerOptions);
    const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
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
        data: dataSale,
        setData: setDataSale,
        errors: errorsSale,
        processing: processingSale,
        reset: resetSale,

        addItem,
        removeItem,

        handleSubmit: handleSubmitSale,
        handleCancel: handleCancelSale,
        handleChangeItem,
        handleQuantityChange,
        handlePriceChange,
    } = useSale();

    useEffect(() => {
        setLocalCustomers(customerOptions);
    }, [customerOptions]);
    const itemComboboxOptions: ComboboxOption[] = useMemo(() => {
        return items.map((item) => ({
            label: `${item.code} - ${item.name}`,
            value: item.id?.toString() || '',
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

    const customerComboboxOptions: ComboboxOption[] = useMemo(() => {
        return localCustomers.map((customer) => ({
            label: customer.name,
            value: customer.id?.toString() || '',
        }));
    }, [localCustomers]);

    const calculations = useMemo(() => {
        const detailAccessors: ItemAccessors<ISaleDetail> = {
            getQuantity: (detail) => detail.quantity || 0,
            getPrice: (detail) => detail.price || 0,
            getDiscount1Percent: (detail) => detail.discount1_percent || 0,
            getDiscount2Percent: (detail) => detail.discount2_percent || 0,
        };

        return calculateTotals(
            dataSale.details,
            detailAccessors,
            dataSale.ppn_percent,
        );
    }, [dataSale.details, dataSale.ppn_percent]);

    useEffect(() => {
        if (sale) {
            setDataSale('customer_id', sale.customer_id);
            setDataSale('sale_date', sale.sale_date);
            setDataSale('due_date', sale.due_date ?? null);
            setDataSale('ppn_percent', formatNumber(sale.ppn_percent ?? 0));
            setDataSale('notes', sale.notes ?? '');
            setDataSale('details', sale.details);
            const formattedDiscount = sale.details.map((detail) => ({
                ...detail,
                discount1_percent: formatNumber(detail.discount1_percent ?? 0),
                discount2_percent: formatNumber(detail.discount2_percent ?? 0),
            }));
            setDataSale('details', formattedDiscount);

            const formattedQuantity = sale.details.map((detail) =>
                detail.quantity
                    ? formatNumberWithSeparator(detail.quantity)
                    : '0',
            );
            const formattedPrices = sale.details.map((detail) =>
                detail.price ? formatNumberWithSeparator(detail.price) : '0',
            );
            setQuantityDisplayValues(formattedQuantity);
            setPriceDisplayValues(formattedPrices);
            setIsReady(true);
        } else {
            resetSale();
            setQuantityDisplayValues([]);
            setPriceDisplayValues([]);
            setIsReady(true);
        }
    }, [sale, setDataSale, resetSale]);

    if (!isReady) {
        return <Skeleton className="h-full w-full" />;
    }

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                handleSubmitSale(sale);
            }}
            className="space-y-6"
        >
            {/* Header Information */}
            <Card className="content overflow-auto">
                <CardHeader>
                    <CardTitle>Informasi Penjualan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="customer_id">Customer</Label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <AsyncCombobox
                                        initialOptions={customerComboboxOptions}
                                        value={
                                            dataSale.customer_id
                                                ? dataSale.customer_id.toString()
                                                : ''
                                        }
                                        onValueChange={(value) =>
                                            setDataSale(
                                                'customer_id',
                                                Number(value),
                                            )
                                        }
                                        onSelect={(option) => {
                                            if (option && option.customer) {
                                                const customer =
                                                    option.customer as ICustomer;
                                                // Add to local options so the combobox can display the label correctly from initialOptions next time
                                                if (
                                                    !localCustomers.find(
                                                        (c) =>
                                                            c.id ===
                                                            customer.id,
                                                    )
                                                ) {
                                                    setLocalCustomers(
                                                        (prev) => [
                                                            ...prev,
                                                            customer,
                                                        ],
                                                    );
                                                }
                                            }
                                        }}
                                        placeholder="Pilih customer..."
                                        searchPlaceholder="Cari customer..."
                                        className="combobox"
                                        searchUrl="/customers/search"
                                        searchParam="search"
                                    />
                                    <InputError
                                        message={errorsSale.customer_id}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-row gap-4 md:pr-6">
                            <div className="flex flex-col items-start gap-2">
                                <Label htmlFor="sale_date" className="min-w-35">
                                    Tanggal Penjualan{' '}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <DatePicker
                                    value={dataSale.sale_date}
                                    onChange={(value) =>
                                        setDataSale('sale_date', value as Date)
                                    }
                                    className="input-box"
                                />
                                <InputError message={errorsSale.sale_date} />
                            </div>
                            <div className="flex flex-col items-start gap-2">
                                <Label htmlFor="due_date" className="min-w-35">
                                    Tanggal Jatuh Tempo
                                </Label>
                                <div className="flex flex-row gap-2">
                                    <DatePicker
                                        value={dataSale.due_date ?? undefined}
                                        onChange={(value) =>
                                            setDataSale(
                                                'due_date',
                                                value as Date,
                                            )
                                        }
                                        className="input-box"
                                    />
                                    {dataSale.due_date && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                setDataSale('due_date', null)
                                            }
                                            className="btn-danger"
                                        >
                                            Hapus
                                        </Button>
                                    )}
                                </div>
                                <InputError message={errorsSale.due_date} />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Items Table */}
            <Card className="content">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Detail Barang</CardTitle>
                        <Button
                            type="button"
                            onClick={addItem}
                            size="sm"
                            variant="outline"
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
                                {dataSale.details.map((detail, index) => {
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
                                                            errorsSale as Record<
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
                                                        detail.item_uom_id
                                                            ? detail.item_uom_id.toString()
                                                            : ''
                                                    }
                                                    onValueChange={(value) => {
                                                        const itemUomId = Number(value);
                                                        handleChangeItem(
                                                            index,
                                                            'item_uom_id',
                                                            itemUomId,
                                                        );

                                                        // Auto-populate price from Item Master
                                                        const item = items.find(
                                                            (i) =>
                                                                i.id ===
                                                                detail.item_id,
                                                        );
                                                        const itemUom =
                                                            item?.item_uoms?.find(
                                                                (u) =>
                                                                    u.id ===
                                                                    itemUomId,
                                                            );

                                                        if (itemUom) {
                                                            const price = Number(
                                                                itemUom.price ??
                                                                0,
                                                            );
                                                            handleChangeItem(
                                                                index,
                                                                'price',
                                                                price,
                                                            );

                                                            // Update display value
                                                            const updatedDisplayValues =
                                                                [
                                                                    ...priceDisplayValues,
                                                                ];
                                                            updatedDisplayValues[
                                                                index
                                                            ] = formatCurrency(
                                                                price,
                                                            );
                                                            setPriceDisplayValues(
                                                                updatedDisplayValues,
                                                            );
                                                        }
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
                                                            errorsSale as Record<
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
                                                            errorsSale as Record<
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
                                                />
                                                <InputError
                                                    message={
                                                        (
                                                            errorsSale as Record<
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
                                                />
                                                <InputError
                                                    message={
                                                        (
                                                            errorsSale as Record<
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
                                                />
                                                <InputError
                                                    message={
                                                        (
                                                            errorsSale as Record<
                                                                string,
                                                                string
                                                            >
                                                        )[
                                                        `details[${index}].discount2_percent`
                                                        ]
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
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
                                                        dataSale.details
                                                            .length === 1
                                                    }
                                                    className="btn-trash"
                                                >
                                                    <Trash2 className="h-4 w-4" />
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
                                value={dataSale.ppn_percent}
                                onChange={(e) => {
                                    const value = formatDiscount(
                                        e.target.value,
                                    );
                                    setDataSale('ppn_percent', value as any);
                                }}
                                className="input-box text-right"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Catatan</Label>
                            <Textarea
                                id="notes"
                                value={dataSale.notes}
                                onChange={(e) =>
                                    setDataSale('notes', e.target.value)
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
                        <CardTitle>Total Penjualan</CardTitle>
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
                            <div className="flex justify-between text-sm text-red-600 dark:text-danger-500">
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
                            <div className="flex justify-between text-sm text-red-600 dark:text-danger-500">
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
                            <div className="flex justify-between text-sm text-blue-600 dark:text-primary-500">
                                <span>PPN ({dataSale.ppn_percent}%):</span>
                                <span>
                                    +{formatCurrency(calculations.ppnAmount)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between border-t pt-3 text-lg font-bold">
                            <span>GRAND TOTAL:</span>
                            <span className="text-primary">
                                {formatCurrency(calculations.grandTotal)}
                            </span>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancelSale}
                                disabled={processingSale}
                                className="btn-secondary flex-1"
                            >
                                Reset
                            </Button>
                            <Button
                                type="submit"
                                disabled={processingSale}
                                className="btn-primary flex-1"
                            >
                                {processingSale
                                    ? 'Menyimpan...'
                                    : sale
                                        ? 'Update'
                                        : 'Simpan'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dialog for adding new customer */}
            <CustomerForm
                isModalOpen={isAddCustomerModalOpen}
                onModalClose={() => setIsAddCustomerModalOpen(false)}
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

export default SaleForm;
