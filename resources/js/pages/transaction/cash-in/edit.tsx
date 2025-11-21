import PageTitle from '@/components/page-title';
import CashInForm from '@/components/transaction/cash-ins/cash-in-form';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Bank, ChartOfAccount, CashIn } from '@/types';
import { Head } from '@inertiajs/react';

interface PageProps {
    cashIn: CashIn;
    banks: Bank[];
    incomeAccounts: ChartOfAccount[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Kas Masuk',
        href: '/cash-ins',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

export default function CashInEdit({
    cashIn,
    banks,
    incomeAccounts,
}: PageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Kas Masuk #${cashIn.cash_in_number}`} />
            <PageTitle title={`Edit Kas Masuk #${cashIn.cash_in_number}`} />
            <CashInForm
                cashIn={cashIn}
                banks={banks}
                incomeAccounts={incomeAccounts}
            />
        </AppLayout>
    );
}

