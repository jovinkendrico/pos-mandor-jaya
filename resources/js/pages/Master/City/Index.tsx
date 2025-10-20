import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import CityDeleteConfirmation from '@/components/master/cities/city-delete-confirmation';
import CityForm from '@/components/master/cities/city-form';
import CityTable from '@/components/master/cities/city-table';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/cities';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface City {
    id: number;
    name: string;
}

interface PageProps {
    cities: {
        data: City[];
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
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedCity, setSelectedCity] = useState<City | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleEdit = (city: City) => {
        setSelectedCity(city);
        setIsFormModalOpen(true);
    };

    const handleDelete = (city: City) => {
        setSelectedCity(city);
        setIsDeleteModalOpen(true);
    };

    const handleFormClose = () => {
        setIsFormModalOpen(false);
        setSelectedCity(null);
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Kota" />
                <div className="flex justify-between">
                    <PageTitle title="Kota" />
                    <Button onClick={() => setIsFormModalOpen(true)}>
                        <Plus />
                        Tambah Kota
                    </Button>
                </div>
                <CityTable cities={cities.data} onEdit={handleEdit} onDelete={handleDelete} />
                <CityForm isModalOpen={isFormModalOpen} onOpenChange={handleFormClose} city={selectedCity} />
                <CityDeleteConfirmation isModalOpen={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} city={selectedCity} />
            </AppLayout>
        </>
    );
}

