import PageTitle from '@/components/page-title';
import CashInForm from '@/components/transaction/cash-ins/cash-in-form';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/cash-ins';
import { BreadcrumbItem, IBank, ICashIn, IChartOfAccount } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
    banks: IBank[];
    incomeAccounts: IChartOfAccount[];
    cashIn?: ICashIn;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: '#',
    },
    {
        title: 'Kas Masuk',
        href: index().url,
    },
    {
        title: 'Tambah',
        href: '#',
    },
];

const CashInCreate = (props: PageProps) => {
    const { banks, incomeAccounts, cashIn } = props;

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Tambah Kas Masuk" />
                <div className="flex flex-row items-center gap-2">
                    <Link href={index().url}>
                        <ArrowLeft className="h-8 w-8" />
                    </Link>
                    <PageTitle title="Tambah Kas Masuk" />
                </div>
                <CashInForm
                    banks={banks}
                    incomeAccounts={incomeAccounts}
                    cashIn={cashIn}
                />
            </AppLayout>
        </>
    );
};

export default CashInCreate;
