import PaymentForm from '@/components/accounting/payments/payment-form';
import PaymentTable from '@/components/accounting/payments/payment-table';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import useDisclosure from '@/hooks/use-disclosure';
import AppLayout from '@/layouts/app-layout';
import { destroy as destroyPayment, index } from '@/routes/payments';
import { BreadcrumbItem, IPayment } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface PageProps {
    payments: {
        data: IPayment[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Accounting',
        href: '#',
    },
    {
        title: 'Payments',
        href: index().url,
    },
];

export default function PaymentIndex({ payments }: PageProps) {
    const [selectedPayment, setSelectedPayment] = useState<IPayment | undefined>(
        undefined,
    );

    const handleEdit = (payment: IPayment) => {
        setSelectedPayment(payment);
        openEditModal();
    };

    const handleDelete = (payment: IPayment) => {
        setSelectedPayment(payment);
        openDeleteModal();
    };

    const {
        isOpen: isEditModalOpen,
        openModal: openEditModal,
        closeModal: closeEditModal,
    } = useDisclosure();
    const {
        isOpen: isDeleteModalOpen,
        openModal: openDeleteModal,
        closeModal: closeDeleteModal,
    } = useDisclosure();

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Payments" />
                <div className="flex justify-between">
                    <PageTitle title="Payments" />
                    <Button
                        onClick={() => {
                            setSelectedPayment(undefined);
                            openEditModal();
                        }}
                        className="btn-primary"
                    >
                        <Plus />
                        Tambah Pembayaran
                    </Button>
                </div>
                <PaymentTable
                    payments={payments.data}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
                <PaymentForm
                    isModalOpen={isEditModalOpen}
                    payment={selectedPayment}
                    onModalClose={closeEditModal}
                />
                <DeleteModalLayout
                    dataName={selectedPayment?.payment_number}
                    dataId={selectedPayment?.id}
                    dataType="Payment"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedPayment}
                    getDeleteUrl={(id) => destroyPayment(id).url}
                />
            </AppLayout>
        </>
    );
}
