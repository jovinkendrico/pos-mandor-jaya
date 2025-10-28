import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IBank } from '@/types';
import { Building2, Wallet } from 'lucide-react';

interface BankBalancesProps {
    banks: Array<{
        id: number;
        name: string;
        type: 'bank' | 'cash';
        stored_balance: number;
        calculated_balance: number;
        cash_in: number;
        cash_out: number;
    }>;
}

export default function BankBalances({ banks }: BankBalancesProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    const getTotalBalance = () => {
        return banks.reduce((total, bank) => total + bank.calculated_balance, 0);
    };

    const getTotalCashIn = () => {
        return banks.reduce((total, bank) => total + bank.cash_in, 0);
    };

    const getTotalCashOut = () => {
        return banks.reduce((total, bank) => total + bank.cash_out, 0);
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(getTotalBalance())}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cash In</CardTitle>
                        <div className="text-green-600">↗</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(getTotalCashIn())}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cash Out</CardTitle>
                        <div className="text-red-600">↘</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(getTotalCashOut())}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bank Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {banks.map((bank) => (
                    <Card key={bank.id}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {bank.type === 'bank' ? (
                                    <Building2 className="w-5 h-5" />
                                ) : (
                                    <Wallet className="w-5 h-5" />
                                )}
                                {bank.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Balance:</span>
                                <span className={`font-medium ${
                                    bank.calculated_balance >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {formatCurrency(bank.calculated_balance)}
                                </span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Cash In:</span>
                                <span className="font-medium text-green-600">
                                    {formatCurrency(bank.cash_in)}
                                </span>
                            </div>
                            
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Cash Out:</span>
                                <span className="font-medium text-red-600">
                                    {formatCurrency(bank.cash_out)}
                                </span>
                            </div>

                            <div className="pt-2 border-t">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Stored Balance:</span>
                                    <span className="font-medium">
                                        {formatCurrency(bank.stored_balance)}
                                    </span>
                                </div>
                                
                                {bank.stored_balance !== bank.calculated_balance && (
                                    <Badge variant="destructive" className="mt-2">
                                        Balance Mismatch
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
