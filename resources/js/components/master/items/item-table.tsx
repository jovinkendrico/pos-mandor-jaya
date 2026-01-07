import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { Button } from '@/components/ui/button';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { TableCell } from '@/components/ui/table';
import {
    formatCurrency,
    formatNumber,
    formatNumberWithSeparator,
    parseStringtoNumber,
} from '@/lib/utils';
import { IItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Edit, Info, Package, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ItemTableProps {
    items: IItem[];
    onEdit?: (item: IItem) => void;
    onDelete?: (item: IItem) => void;
    pageFrom?: number;
}

const ItemTable = (props: ItemTableProps) => {
    const { items, onEdit, onDelete, pageFrom } = props;

    const getDefaultUoms = (items: IItem[]): Record<number, number> => {
        return items.reduce(
            (acc, item) => {
                const defaultUom =
                    item.item_uoms?.find((u) => u.is_base) ??
                    item.item_uoms?.[0];
                acc[item.id] = defaultUom?.uom?.id ?? 0;
                return acc;
            },
            {} as Record<number, number>,
        );
    };

    const [selectedUom, setSelectedUom] = useState<Record<number, number>>(() =>
        getDefaultUoms(items),
    );

    useEffect(() => {
        const newDefaultUoms = getDefaultUoms(items);

        setSelectedUom(newDefaultUoms);
    }, [items]);

    const handleChangeUOM = (itemId: number, newUomId: number) => {
        setSelectedUom((prev) => ({
            ...prev,
            [itemId]: newUomId,
        }));
    };

    const tableColumn = [
        'Kode',
        'Nama Barang',
        'Stok Fisik',
        'Pembelian (Pending)',
        'Penjualan (Pending)',
        'Stok Tersedia',
        'Harga Modal',
        'Deskripsi',
        'Satuan (UOM)',
        'Harga',
        'Aksi',
    ];

    return (
        <TableLayout
            tableName="Barang"
            tableColumn={tableColumn}
            tableRow={items}
            text="Tidak ada data Barang"
            pageFrom={pageFrom}
            renderRow={(row) => {
                const currentUomId = selectedUom[row.id];

                const currentUom = row.item_uoms?.find(
                    (u) => u.uom.id === currentUomId,
                );

                const uomOptions: ComboboxOption[] = row.item_uoms?.map(
                    (uom) => ({
                        value: uom.uom?.id.toString() ?? '0',
                        label: uom.uom?.name ?? '-',
                    }),
                );
                return (
                    <>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {row.code}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {row.name}
                        </TableCell>

                        {/* Stok Fisik */}
                        <TableCell className="flex w-full items-center justify-center text-center font-medium">
                            {currentUom
                                ? formatNumberWithSeparator(
                                    row.stock / currentUom.conversion_value,
                                )
                                : '-'}
                        </TableCell>

                        {/* Pembelian (Pending) */}
                        <TableCell className="flex w-full items-center justify-center text-center text-orange-600 dark:text-orange-500">
                            {currentUom
                                ? formatNumberWithSeparator(
                                    (row.pending_purchase_stock ?? 0) /
                                    currentUom.conversion_value,
                                )
                                : '-'}
                        </TableCell>

                        {/* Stok Pending */}
                        <TableCell className="flex w-full items-center justify-center text-center text-yellow-600 dark:text-yellow-500">
                            {currentUom
                                ? formatNumberWithSeparator(
                                    (row.pending_stock ?? 0) /
                                    currentUom.conversion_value,
                                )
                                : '-'}
                        </TableCell>

                        {/* Stok Tersedia */}
                        <TableCell className="flex w-full items-center justify-center text-center font-bold text-blue-600 dark:text-blue-500">
                            {currentUom
                                ? formatNumberWithSeparator(
                                    (row.available_stock ?? row.stock) /
                                    currentUom.conversion_value,
                                )
                                : '-'}
                        </TableCell>

                        <TableCell className="flex w-full items-center justify-center text-center">
                            {formatCurrency(
                                parseStringtoNumber(
                                    String(formatNumber(row.modal_price ?? 0)),
                                ),
                            )}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {row.description ?? '-'}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            <Combobox
                                options={uomOptions}
                                searchPlaceholder="Cari UOM..."
                                placeholder="Pilih UOM..."
                                emptyText="UOM tidak ditemukan"
                                value={currentUomId?.toString() ?? ''}
                                onValueChange={(newUomId) =>
                                    handleChangeUOM(row.id, Number(newUomId))
                                }
                                className="w-full min-w-[100px] dark:!bg-white dark:!text-primary-200"
                            />
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {formatCurrency(
                                parseStringtoNumber(
                                    String(
                                        formatNumber(currentUom?.price ?? 0),
                                    ),
                                ),
                            )}
                        </TableCell>
                        <TableCell className="flex w-full flex-wrap items-center justify-start gap-2">
                            <Link href={`/items/${row.id}`}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="btn-info"
                                    title="Detail Barang"
                                >
                                    <Info />
                                </Button>
                            </Link>
                            <Link href={`/items/${row.id}/stock-card`}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="btn-info"
                                    title="Kartu Stok"
                                >
                                    <Package />
                                </Button>
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit?.(row)}
                                className="btn-edit"
                            >
                                <Edit />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDelete?.(row)}
                                className="btn-trash"
                            >
                                <Trash />
                            </Button>
                        </TableCell>
                    </>
                );
            }}
        />
    );
};

export default ItemTable;
