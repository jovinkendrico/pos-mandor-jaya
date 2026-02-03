import { usePermission } from '@/hooks/use-permission';
import BranchForm from '@/components/master/branch/branch-form';
import BranchTable from '@/components/master/branch/branch-table';
import PageTitle from '@/components/page-title';
import FilterBar from '@/components/transaction/filter-bar';
import { Button } from '@/components/ui/button';
import DeleteModalLayout from '@/components/ui/DeleteModalLayout/DeleteModalLayout';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import useDisclosure from '@/hooks/use-disclosure';
import useResourceFilters from '@/hooks/use-resource-filters';
import AppLayout from '@/layouts/app-layout';
import { destroy as destroyBranch, index } from '@/routes/branches';
import { BreadcrumbItem, IBranch, PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master',
        href: '#',
    },
    {
        title: 'Cabang',
        href: index().url,
    },
];

interface BranchProps {
    branches: PaginatedData<IBranch>;
    filters?: {
        search: string;
        sort_by: string;
        sort_order: string;
    };
}

const BranchPage = (props: BranchProps) => {
    const {
        branches,
        filters = {
            search: '',
            sort_by: 'code',
            sort_order: 'asc',
        },
    } = props;

    const { allFilters, searchTerm, handleFilterChange } = useResourceFilters(
        index,
        {
            ...filters,
            status: 'all',
            date_from: '',
            date_to: '',
        },
    );
    const { hasPermission } = usePermission();

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

    const [selectedBranch, setSelectedBranch] = useState<IBranch | undefined>(undefined);

    const handleEdit = (branch: IBranch) => {
        setSelectedBranch(branch);
        openEditModal();
    };

    const handleDelete = (branch: IBranch) => {
        setSelectedBranch(branch);
        openDeleteModal();
    };

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Cabang" />
                <div className="flex justify-between">
                    <PageTitle title="Cabang / Branch" />
                    {hasPermission('branches.index') && ( // Assuming permissions
                        <Button
                            onClick={() => {
                                setSelectedBranch(undefined);
                                openEditModal();
                            }}
                            className="btn-primary"
                        >
                            <Plus />
                            Tambah Cabang
                        </Button>
                    )}
                </div>
                <FilterBar
                    filters={{ ...allFilters, search: searchTerm }}
                    onFilterChange={handleFilterChange}
                    defaultSortOrder="asc"
                    showPaymentStatus={false}
                    showDateRange={false}
                    showStatus={false}
                    sortOptions={[
                        { value: 'code', label: 'Kode' },
                        { value: 'name', label: 'Nama' }
                    ]}
                />
                <div className="mt-4">
                    <BranchTable
                        branches={branches.data}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        pageFrom={branches.from}
                    />
                </div>
                {branches.data.length !== 0 && <TablePagination data={branches} />}
                <BranchForm
                    isModalOpen={isEditModalOpen}
                    onModalClose={closeEditModal}
                    branch={selectedBranch}
                />
                <DeleteModalLayout
                    dataId={selectedBranch?.id}
                    dataName={selectedBranch?.name}
                    dataType="Branch"
                    isModalOpen={isDeleteModalOpen}
                    onModalClose={closeDeleteModal}
                    setSelected={setSelectedBranch}
                    getDeleteUrl={(id: number) => destroyBranch(id).url}
                />
            </AppLayout>
        </>
    );
};

export default BranchPage;
