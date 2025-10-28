import PageTitle from '@/components/page-title';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { CreditCard, DollarSign, Calendar, CheckCircle, XCircle } from 'lucide-react';

interface Transaction {
    id: number;
    number: string;
    date: string;
    total_amount: number;
    total_paid: number;
    remaining_amount: number;
    is_fully_paid: boolean;
    payment_percentage: number;
    type: 'Purchase' | 'Sale';
    supplier?: { name: string };
    customer?: { name: string };
}

interface PageProps {
    transactions: {
        data: Transaction[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Accounting',
        href: '#',
    },
    {
        title: 'Payment Settlement',
        href: '#',
    },
];

export default function PaymentSettlementIndex({ transactions }: PageProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    const handlePayment = (transaction: Transaction) => {
        // TODO: Open payment modal
        console.log('Payment for transaction:', transaction);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payment Settlement" />
            <div className="space-y-6">
                <PageTitle title="Payment Settlement" />

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Transactions
                            </CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {transactions.data.length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Fully Paid
                            </CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {transactions.data.filter(t => t.is_fully_paid).length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Pending Payment
                            </CardTitle>
                            <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {transactions.data.filter(t => !t.is_fully_paid).length}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Transactions Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Transaksi</TableHead>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Supplier/Customer</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Sudah Dibayar</TableHead>
                                    <TableHead>Sisa</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.data.map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell className="font-medium">
                                            {transaction.number}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={transaction.type === 'Sale' ? 'default' : 'secondary'}>
                                                {transaction.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(transaction.date).toLocaleDateString('id-ID')}
                                        </TableCell>
                                        <TableCell>
                                            {transaction.supplier?.name || transaction.customer?.name || '-'}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {formatCurrency(transaction.total_amount)}
                                        </TableCell>
                                        <TableCell className="text-green-600">
                                            {formatCurrency(transaction.total_paid)}
                                        </TableCell>
                                        <TableCell className={transaction.remaining_amount > 0 ? 'text-red-600' : 'text-green-600'}>
                                            {formatCurrency(transaction.remaining_amount)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={transaction.is_fully_paid ? 'default' : 'destructive'}>
                                                {transaction.is_fully_paid ? 'Lunas' : 'Belum Lunas'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {!transaction.is_fully_paid && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handlePayment(transaction)}
                                                    className="btn-primary"
                                                >
                                                    <DollarSign className="w-4 h-4 mr-2" />
                                                    Bayar
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
