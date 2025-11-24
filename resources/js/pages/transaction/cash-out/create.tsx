import PageTitle from '@/components/page-title';
import CashOutForm from '@/components/transaction/cash-outs/cash-out-form';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Bank, ChartOfAccount } from '@/types';
import { Head } from '@inertiajs/react';

interface PageProps {
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
        title: 'Tambah',
        href: '#',
    },
];

export default function CashOutCreate({
    banks,
    expenseAccounts,
}: PageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Kas Keluar" />
            <PageTitle title="Tambah Kas Keluar" />
            <CashOutForm banks={banks} expenseAccounts={expenseAccounts} />
        </AppLayout>
    );
}

