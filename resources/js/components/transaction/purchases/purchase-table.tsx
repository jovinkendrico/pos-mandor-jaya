import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Eye } from 'lucide-react';

interface Supplier {
    id: number;
    name: string;
}

interface Purchase {
    id: number;
    purchase_number: string;
    supplier?: Supplier;
    purchase_date: string;
    due_date?: string;
    total_amount: string;
    status: 'pending' | 'confirmed';
}

interface PurchaseTableProps {
    purchases: Purchase[];
    onView: (purchase: Purchase) => void;
}

export default function PurchaseTable({ purchases, onView }: PurchaseTableProps) {
    const formatCurrency = (value: string | number) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[150px]">No. Pembelian</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Jatuh Tempo</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center w-[100px]">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {purchases.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                                Tidak ada data pembelian
                            </TableCell>
                        </TableRow>
                    ) : (
                        purchases.map((purchase) => (
                            <TableRow key={purchase.id}>
                                <TableCell className="font-medium">{purchase.purchase_number}</TableCell>
                                <TableCell>{purchase.supplier?.name || '-'}</TableCell>
                                <TableCell>{formatDate(purchase.purchase_date)}</TableCell>
                                <TableCell>{purchase.due_date ? formatDate(purchase.due_date) : '-'}</TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(purchase.total_amount)}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={purchase.status === 'confirmed' ? 'default' : 'secondary'}>
                                        {purchase.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button size="icon" variant="ghost" onClick={() => onView(purchase)}>
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

