import PageTitle from '@/components/page-title';
import CashInForm from '@/components/transaction/cash-ins/cash-in-form';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Bank, ChartOfAccount } from '@/types';
import { Head } from '@inertiajs/react';

interface PageProps {
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
        title: 'Tambah',
        href: '#',
    },
];

export default function CashInCreate({ banks, incomeAccounts }: PageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Kas Masuk" />
            <PageTitle title="Tambah Kas Masuk" />
            <CashInForm banks={banks} incomeAccounts={incomeAccounts} />
        </AppLayout>
    );
}

