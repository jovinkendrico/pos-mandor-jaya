import PageTitle from '@/components/page-title';
import CashOutForm from '@/components/transaction/cash-outs/cash-out-form';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Bank, ChartOfAccount, CashOut } from '@/types';
import { Head } from '@inertiajs/react';

interface PageProps {
    cashOut: CashOut;
    banks: Bank[];
    expenseAccounts: ChartOfAccount[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Kas Keluar',
        href: '/cash-outs',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

export default function CashOutEdit({
    cashOut,
    banks,
    expenseAccounts,
}: PageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Kas Keluar #${cashOut.cash_out_number}`} />
            <PageTitle title={`Edit Kas Keluar #${cashOut.cash_out_number}`} />
            <CashOutForm
                cashOut={cashOut}
                banks={banks}
                expenseAccounts={expenseAccounts}
            />
        </AppLayout>
    );
}

