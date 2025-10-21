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

interface Customer {
    id: number;
    name: string;
}

interface Sale {
    id: number;
    sale_number: string;
    customer?: Customer;
    sale_date: string;
    due_date?: string;
    total_amount: string;
    total_profit: string;
    status: 'pending' | 'confirmed';
}

interface SaleTableProps {
    sales: Sale[];
    onView: (sale: Sale) => void;
}

export default function SaleTable({ sales, onView }: SaleTableProps) {
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
                        <TableHead className="w-[150px]">No. Penjualan</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Jatuh Tempo</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center w-[100px]">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sales.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground">
                                Tidak ada data penjualan
                            </TableCell>
                        </TableRow>
                    ) : (
                        sales.map((sale) => (
                            <TableRow key={sale.id}>
                                <TableCell className="font-medium">{sale.sale_number}</TableCell>
                                <TableCell>{sale.customer?.name || '-'}</TableCell>
                                <TableCell>{formatDate(sale.sale_date)}</TableCell>
                                <TableCell>{sale.due_date ? formatDate(sale.due_date) : '-'}</TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(sale.total_amount)}
                                </TableCell>
                                <TableCell className="text-right font-medium text-green-600">
                                    {sale.status === 'confirmed' ? formatCurrency(sale.total_profit) : '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={sale.status === 'confirmed' ? 'default' : 'secondary'}>
                                        {sale.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button size="icon" variant="ghost" onClick={() => onView(sale)}>
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

