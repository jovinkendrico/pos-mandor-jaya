import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ItemUom {
    id: number;
    uom_name: string;
    conversion_value: number;
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

interface ItemTableProps {
    items: Item[];
    onEdit?: (item: Item) => void;
    onDelete?: (item: Item) => void;
}

export default function ItemTable({ items, onEdit, onDelete }: ItemTableProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Kode</TableHead>
                        <TableHead>Nama Barang</TableHead>
                        <TableHead>Base UOM</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>UOM Tersedia</TableHead>
                        <TableHead className="text-right">Harga Range</TableHead>
                        <TableHead className="text-right w-[100px]">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                                Tidak ada data barang
                            </TableCell>
                        </TableRow>
                    ) : (
                        items.map((item) => {
                            const baseUom = item.uoms?.find((u) => u.is_base);
                            const prices = item.uoms?.map((u) => parseFloat(u.price)) || [];
                            const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                            const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

                            return (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.code}</TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{item.name}</div>
                                            {item.description && (
                                                <div className="text-sm text-muted-foreground line-clamp-1">
                                                    {item.description}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{item.base_uom}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {parseFloat(item.stock).toLocaleString('id-ID', {
                                            minimumFractionDigits: 2,
                                        })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {item.uoms?.map((uom) => (
                                                <Badge
                                                    key={uom.id}
                                                    variant={uom.is_base ? 'default' : 'outline'}
                                                    className="text-xs"
                                                >
                                                    {uom.uom_name}
                                                    {!uom.is_base &&
                                                        ` (${uom.conversion_value}x)`}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="text-sm">
                                            {minPrice === maxPrice
                                                ? formatCurrency(minPrice)
                                                : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {onEdit && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => onEdit(item)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {onDelete && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => onDelete(item)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

