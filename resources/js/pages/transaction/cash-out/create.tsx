import PageTitle from '@/components/page-title';
import CashOutForm from '@/components/transaction/cash-outs/cash-out-form';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/cash-outs';
import { BreadcrumbItem, IBank, ICashOut, IChartOfAccount } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
    banks: IBank[];
    expenseAccounts: IChartOfAccount[];
    cashOut?: ICashOut;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Kas Keluar',
        href: index().url,
    },
    {
        title: 'Tambah',
        href: '#',
    },
];

const CashOutCreate = (props: PageProps) => {
    const { banks, expenseAccounts, cashOut } = props;

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Tambah Kas Keluar" />
                <div className="flex flex-row items-center gap-2">
                    <Link href={index().url}>
                        <ArrowLeft className="h-8 w-8" />
                    </Link>
                    <PageTitle title="Tambah Kas Keluar" />
                </div>
                <CashOutForm
                    banks={banks}
                    expenseAccounts={expenseAccounts}
                    cashOut={cashOut}
                />
            </AppLayout>
        </>
    );
};

export default CashOutCreate;

