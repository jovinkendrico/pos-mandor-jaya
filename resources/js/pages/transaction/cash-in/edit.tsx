import PageTitle from '@/components/page-title';
import CashInForm from '@/components/transaction/cash-ins/cash-in-form';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/cash-ins';
import { BreadcrumbItem, IBank, ICashIn, IChartOfAccount } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
    cashIn: ICashIn;
    banks: IBank[];
    incomeAccounts: IChartOfAccount[];
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
        title: 'Edit',
        href: '#',
    },
];

const CashInEdit = ({ cashIn, banks, incomeAccounts }: PageProps) => {
    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Edit Kas Masuk ${cashIn.cash_in_number}`} />
                <div className="flex flex-row items-center gap-2">
                    <Link href={index().url}>
                        <ArrowLeft className="h-8 w-8" />
                    </Link>
                    <PageTitle
                        title={`Edit Kas Masuk ${cashIn.cash_in_number}`}
                    />
                </div>
                <CashInForm
                    cashIn={cashIn}
                    banks={banks}
                    incomeAccounts={incomeAccounts}
                />
            </AppLayout>
        </>
    );
};

export default CashInEdit;

