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
}

interface SaleReturn {
    id: number;
    return_number: string;
    sale: Sale;
    return_date: string;
    total_amount: string;
    total_profit_adjustment: string;
    status: 'pending' | 'confirmed';
}

interface SaleReturnTableProps {
    returns: SaleReturn[];
    onView: (returnData: SaleReturn) => void;
}

export default function SaleReturnTable({ returns, onView }: SaleReturnTableProps) {
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
                        <TableHead className="w-[150px]">No. Retur</TableHead>
                        <TableHead>No. Penjualan</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Tanggal Retur</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Profit Adj.</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center w-[100px]">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {returns.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground">
                                Tidak ada data retur penjualan
                            </TableCell>
                        </TableRow>
                    ) : (
                        returns.map((returnData) => (
                            <TableRow key={returnData.id}>
                                <TableCell className="font-medium">{returnData.return_number}</TableCell>
                                <TableCell className="font-mono text-sm">{returnData.sale.sale_number}</TableCell>
                                <TableCell>{returnData.sale.customer?.name || '-'}</TableCell>
                                <TableCell>{formatDate(returnData.return_date)}</TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(returnData.total_amount)}
                                </TableCell>
                                <TableCell className="text-right font-medium text-red-600">
                                    {returnData.status === 'confirmed' ? formatCurrency(returnData.total_profit_adjustment) : '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant={returnData.status === 'confirmed' ? 'default' : 'secondary'}>
                                        {returnData.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Button size="icon" variant="ghost" onClick={() => onView(returnData)}>
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

