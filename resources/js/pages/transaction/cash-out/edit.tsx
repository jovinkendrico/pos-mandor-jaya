import PageTitle from '@/components/page-title';
import CashOutForm from '@/components/transaction/cash-outs/cash-out-form';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/cash-outs';
import { BreadcrumbItem, IBank, ICashOut, IChartOfAccount, IVehicle } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
    cashOut: ICashOut;
    banks: IBank[];
    expenseAccounts: IChartOfAccount[];
    vehicles: IVehicle[];
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
        title: 'Edit',
        href: '#',
    },
];

const CashOutEdit = ({ cashOut, banks, expenseAccounts, vehicles }: PageProps) => {
    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Edit Kas Keluar ${cashOut.cash_out_number}`} />
                <div className="flex flex-row items-center gap-2">
                    <Link href={index().url}>
                        <ArrowLeft className="h-8 w-8" />
                    </Link>
                    <PageTitle
                        title={`Edit Kas Keluar ${cashOut.cash_out_number}`}
                    />
                </div>
                <CashOutForm
                    cashOut={cashOut}
                    banks={banks}
                    expenseAccounts={expenseAccounts}
                    vehicles={vehicles}
                />
            </AppLayout>
        </>
    );
};

export default CashOutEdit;

