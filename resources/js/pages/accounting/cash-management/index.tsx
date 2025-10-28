import PageTitle from '@/components/page-title';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus, ArrowUpRight, ArrowDownRight, DollarSign } from 'lucide-react';

interface CashTransaction {
    id: number;
    type: 'in' | 'out';
    amount: number;
    description: string;
    bank_name: string;
    transaction_date: string;
    created_at: string;
}

interface PageProps {
    cashTransactions: {
        data: CashTransaction[];
    };
    summary: {
        total_cash_in: number;
        total_cash_out: number;
        net_cash_flow: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Accounting',
        href: '#',
    },
    {
        title: 'Cash Management',
        href: '#',
    },
];

export default function CashManagementIndex({ cashTransactions, summary }: PageProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    const handleAddCashIn = () => {
        // TODO: Open cash in modal
        console.log('Add Cash In');
    };

    const handleAddCashOut = () => {
        // TODO: Open cash out modal
        console.log('Add Cash Out');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cash Management" />
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <PageTitle title="Cash Management" />
                    <div className="flex gap-2">
                        <Button onClick={handleAddCashIn} className="btn-primary">
                            <ArrowUpRight className="w-4 h-4 mr-2" />
                            Cash In
                        </Button>
                        <Button onClick={handleAddCashOut} variant="outline">
                            <ArrowDownRight className="w-4 h-4 mr-2" />
                            Cash Out
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Cash In
                            </CardTitle>
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(summary.total_cash_in)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Cash Out
                            </CardTitle>
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(summary.total_cash_out)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Net Cash Flow
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${
                                summary.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {formatCurrency(summary.net_cash_flow)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Cash Transactions Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Cash Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Deskripsi</TableHead>
                                    <TableHead>Jumlah</TableHead>
                                    <TableHead>Bank</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cashTransactions.data.map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell>
                                            <Badge variant={transaction.type === 'in' ? 'default' : 'secondary'}>
                                                {transaction.type === 'in' ? 'Cash In' : 'Cash Out'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {transaction.description}
                                        </TableCell>
                                        <TableCell className={`font-medium ${
                                            transaction.type === 'in' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {transaction.type === 'in' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                        </TableCell>
                                        <TableCell>
                                            {transaction.bank_name}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(transaction.transaction_date).toLocaleDateString('id-ID')}
                                        </TableCell>
                                        <TableCell>
                                            <Button size="sm" variant="outline">
                                                Edit
                                            </Button>
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
