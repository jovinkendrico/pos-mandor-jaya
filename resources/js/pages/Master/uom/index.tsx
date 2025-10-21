import UOMForm from '@/components/master/uom/uom-form';
import UOMTable from '@/components/master/uom/uom-table';
import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index } from '@/routes/uoms';
import { BreadcrumbItem, UOM } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master',
        href: '#',
    },
    {
        title: 'UOM',
        href: index().url,
    },
];

interface UOMProps {
    uoms: UOM[];
}

const UOMPage = (props: UOMProps) => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="UOM" />
                <div className="flex justify-between">
                    <PageTitle title="Bank/Cash" />
                    <Button onClick={() => setIsFormModalOpen(true)}>
                        <Plus />
                        Tambah UOM
                    </Button>
                </div>
                <UOMTable uoms={props.uoms} />
                <UOMForm
                    isModalOpen={isFormModalOpen}
                    onOpenChange={setIsFormModalOpen}
                />
            </AppLayout>
        </>
    );
};

export default UOMPage;
