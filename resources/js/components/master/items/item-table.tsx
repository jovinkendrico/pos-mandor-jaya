import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { Button } from '@/components/ui/button';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { TableCell } from '@/components/ui/table';
import { formatCurrency, parseCurrency } from '@/lib/utils';
import { IItem } from '@/types';
import { Edit, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ItemTableProps {
    items: IItem[];
    onEdit?: (item: IItem) => void;
    onDelete?: (item: IItem) => void;
}

const ItemTable = (props: ItemTableProps) => {
    const { items, onEdit, onDelete } = props;

    const [selectedUom, setSelectedUom] = useState<Record<number, number>>(
        () => {
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
        },
    );

    useEffect(() => {
        setSelectedUom((prevSelected) => {
            const newSelected = { ...prevSelected };
            let hasChanged = false;

            for (const item of items) {
                if (prevSelected[item.id] === undefined) {
                    const defaultUom =
                        item.item_uoms?.find((u) => u?.is_base) ??
                        item.item_uoms?.[0];

                    if (defaultUom) {
                        newSelected[item.id] = defaultUom?.uom?.id ?? 0;
                        hasChanged = true;
                    }
                }
            }
            console.log(newSelected);
            return hasChanged ? newSelected : prevSelected;
        });
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
        'Deskripsi',
        'Satuan (UOM)',
        'Harga',
        'Aksi',
    ];
    console.log(items);

    return (
        <TableLayout
            tableName="Barang"
            tableColumn={tableColumn}
            tableRow={items}
            text="Tidak ada data Barang"
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
                            {row.stock}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {row.description}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            <Combobox
                                options={uomOptions}
                                value={currentUomId?.toString() ?? ''}
                                onValueChange={(newUomId) =>
                                    handleChangeUOM(row.id, Number(newUomId))
                                }
                            />
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center text-center">
                            {formatCurrency(
                                parseCurrency(String(currentUom?.price ?? 0)),
                            )}
                        </TableCell>
                        <TableCell className="flex w-full items-center justify-center gap-2 text-center">
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
