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
import { Edit, Info, Trash } from 'lucide-react';
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
        'Stok',
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
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {currentUom
                                ? formatNumberWithSeparator(
                                      row.stock / currentUom?.conversion_value,
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
                        <TableCell className="flex w-full items-center justify-center gap-2 text-center">
                            <Link href={`/items/${row.id}`}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="btn-info"
                                >
                                    <Info />
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
