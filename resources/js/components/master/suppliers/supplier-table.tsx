import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { ISupplier } from '@/types';
import { Edit, History, Trash } from 'lucide-react';
import { Button } from '../../ui/button';
import { TableCell } from '../../ui/table';
import { router } from '@inertiajs/react';

interface SupplierTableProps {
    suppliers: ISupplier[];
    onEdit?: (supplier: ISupplier) => void;
    onDelete?: (supplier: ISupplier) => void;
    pageFrom?: number;
}

const SupplierTable = (props: SupplierTableProps) => {
    const { suppliers, onEdit, onDelete, pageFrom } = props;

    const tableColumn = [
        'Nama Supplier',
        'Alamat',
        'Kota',
        'No. Telepon',
        'Contact Person',
        'Aksi',
    ];
    return (
        <TableLayout
            tableName="Supplier"
            tableColumn={tableColumn}
            tableRow={suppliers}
            text="Tidak ada data Supplier"
            pageFrom={pageFrom}
            renderRow={(row) => (
                <>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.name}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.address || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.city?.name || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.phone_number || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.contact || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center gap-2 text-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(`/purchases?supplier_id=${row.id}`)}
                            className="btn-info"
                            title="Lihat Riwayat Pembelian"
                        >
                            <History />
                        </Button>
                        {onEdit && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(row)}
                                className="btn-edit"
                            >
                                <Edit />
                            </Button>
                        )}
                        {onDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onDelete(row)}
                                className="btn-trash"
                            >
                                <Trash />
                            </Button>
                        )}
                    </TableCell>
                </>
            )}
        />
    );
};

export default SupplierTable;
