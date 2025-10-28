import BankBalances from '@/components/accounting/cash-flows/bank-balances';
import PageTitle from '@/components/page-title';
import AppLayout from '@/layouts/app-layout';
import { getBankBalances } from '@/routes/cash-flows';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface BankBalance {
    id: number;
    name: string;
    type: 'bank' | 'cash';
    stored_balance: number;
    calculated_balance: number;
    cash_in: number;
    cash_out: number;
}

interface PageProps {
    banks?: BankBalance[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Accounting',
        href: '#',
    },
    {
        title: 'Bank Balances',
        href: '#',
    },
];

export default function BankBalancesPage({ banks: initialBanks }: PageProps) {
    const [banks, setBanks] = useState<BankBalance[]>(initialBanks || []);

    useEffect(() => {
        // Fetch bank balances if not provided
        if (!initialBanks) {
            getBankBalances();
        }
    }, [initialBanks]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Bank Balances" />
            <div className="space-y-6">
                <PageTitle title="Bank Balances" />
                <BankBalances banks={banks} />
            </div>
        </AppLayout>
    );
}
