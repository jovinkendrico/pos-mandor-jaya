import StockMovementTable from '@/components/master/items/stock-movement/stock-movement-table';
import PageTitle from '@/components/page-title';
import TablePagination from '@/components/ui/TablePagination/table-pagination';
import AppLayout from '@/layouts/app-layout';
import { index, show } from '@/routes/items';
import {
    BreadcrumbItem,
    IItem,
    IItemStockMovement,
    PaginatedData,
} from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
    stockMovements: PaginatedData<IItemStockMovement>;
    item: IItem;
}

const ShowStock = (props: PageProps) => {
    const { stockMovements, item } = props;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Master',
            href: '#',
        },
        {
            title: 'Barang',
            href: index().url,
        },
        {
            title: item.name,
            href: show(item.id).url,
        },
    ];

    return (
        <>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Barang" />
                <div className="flex flex-row items-center gap-2">
                    <Link href={index().url}>
                        <ArrowLeft className="h-8 w-8" />
                    </Link>
                    <PageTitle title={`Perpindahan Stok (${item.name})`} />
                </div>
                <StockMovementTable
                    pageFrom={1}
                    stock_movements={stockMovements.data}
                    item_name={item.name}
                />
                {stockMovements.data.length !== 0 && (
                    <TablePagination data={stockMovements} />
                )}
            </AppLayout>
        </>
    );
};

export default ShowStock;
