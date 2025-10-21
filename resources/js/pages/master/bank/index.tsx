import BankDeleteConfirmation from '@/components/master/banks/bank-delete-confirmation';
import BankForm from '@/components/master/banks/bank-form';
import BankTable from '@/components/master/banks/bank-table';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/banks';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface Bank {
    id: number;
    name: string;
    type: 'bank' | 'cash';
    account_number?: string;
    account_name?: string;
    balance?: number;
    description?: string;
}

interface PageProps {
    banks: {
        data: Bank[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master',
        href: '#',
    },
    {
        title: 'Bank/Cash',
        href: index().url,
    },
];

export default function BankIndex({ banks }: PageProps) {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleEdit = (bank: Bank) => {
        setSelectedBank(bank);
        setIsFormModalOpen(true);
    };

    const handleDelete = (bank: Bank) => {
        setSelectedBank(bank);
        setIsDeleteModalOpen(true);
    };

    const handleFormClose = () => {
        setIsFormModalOpen(false);
        setSelectedBank(null);
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Bank/Cash" />
                <div className="flex justify-between">
                    <PageTitle title="Bank/Cash" />
                    <Button onClick={() => setIsFormModalOpen(true)}>
                        <Plus />
                        Tambah Bank/Cash
                    </Button>
                </div>
                <BankTable
                    banks={banks.data}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
                <BankForm
                    isModalOpen={isFormModalOpen}
                    onOpenChange={handleFormClose}
                    bank={selectedBank}
                />
                <BankDeleteConfirmation
                    isModalOpen={isDeleteModalOpen}
                    onOpenChange={setIsDeleteModalOpen}
                    bank={selectedBank}
                />
            </AppLayout>
        </>
    );
}
