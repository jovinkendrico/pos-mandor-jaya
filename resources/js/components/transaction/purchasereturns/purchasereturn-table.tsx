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
}

interface PurchaseReturn {
    id: number;
    return_number: string;
    purchase: Purchase;
    return_date: string;
    total_amount: string;
    status: 'pending' | 'confirmed';
}

interface PurchaseReturnTableProps {
    returns: PurchaseReturn[];
    onView: (returnData: PurchaseReturn) => void;
}

export default function PurchaseReturnTable({ returns, onView }: PurchaseReturnTableProps) {
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
                        <TableHead>No. Pembelian</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Tanggal Retur</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center w-[100px]">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {returns.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                                Tidak ada data retur pembelian
                            </TableCell>
                        </TableRow>
                    ) : (
                        returns.map((returnData) => (
                            <TableRow key={returnData.id}>
                                <TableCell className="font-medium">{returnData.return_number}</TableCell>
                                <TableCell className="font-mono text-sm">{returnData.purchase.purchase_number}</TableCell>
                                <TableCell>{returnData.purchase.supplier?.name || '-'}</TableCell>
                                <TableCell>{formatDate(returnData.return_date)}</TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(returnData.total_amount)}
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

