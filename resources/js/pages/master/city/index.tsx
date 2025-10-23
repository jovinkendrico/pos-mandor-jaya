import CityForm from '@/components/master/cities/city-form';
import CityTable from '@/components/master/cities/city-table';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import useDisclosure from '@/hooks/use-disclosure';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/cities';
import { BreadcrumbItem, ICity } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface PageProps {
    cities: {
        data: ICity[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master',
        href: '#',
    },
    {
        title: 'Kota',
        href: index().url,
    },
];

export default function CityIndex({ cities }: PageProps) {
    const [selectedCity, setSelectedCity] = useState<ICity | undefined>(
        undefined,
    );

    const handleEdit = (city: ICity) => {
        setSelectedCity(city);
        openEditModal();
    };

    const handleDelete = (city: ICity) => {
        setSelectedCity(city);
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
                <Head title="Kota" />
                <div className="flex justify-between">
                    <PageTitle title="Kota" />
                    <Button
                        onClick={() => {
                            setSelectedCity(undefined);
                            openEditModal();
                        }}
                        className="btn-primary"
                    >
                        <Plus />
                        Tambah Kota
                    </Button>
                </div>
                <CityTable
                    cities={cities.data}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
                <CityForm
                    isModalOpen={isEditModalOpen}
                    city={selectedCity}
                    onModalClose={closeEditModal}
                />
                <DeleteModalLayout
                    dataName={selectedCity?.name}
                    dataId={selectedCity?.id}
                    dataType="City"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedCity}
                />
            </AppLayout>
        </>
    );
}
