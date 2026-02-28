import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { Button } from '@/components/ui/button';
import { IVehicle } from '@/types';
import { Edit, Trash } from 'lucide-react';
import { TableCell } from '../../ui/table';

interface VehicleTableProps {
    vehicles: IVehicle[];
    onEdit?: (vehicle: IVehicle) => void;
    onDelete?: (vehicle: IVehicle) => void;
    pageFrom?: number;
}

const VehicleTable = (props: VehicleTableProps) => {
    const { vehicles, onEdit, onDelete, pageFrom } = props;

    const tableColumn = [
        'Nomor Polisi (BK)',
        'Nama Truk / Keterangan',
        'Supir',
        'Status',
        'Aksi',
    ];

    return (
        <TableLayout
            tableName="Kendaraan"
            tableColumn={tableColumn}
            tableRow={vehicles}
            text="Tidak ada data Kendaraan"
            pageFrom={pageFrom}
            renderRow={(row) => (
                <>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.police_number}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.name || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.driver || '-'}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center text-center">
                        {row.is_active ? (
                            <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                                Aktif
                            </span>
                        ) : (
                            <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-800">
                                Nonaktif
                            </span>
                        )}
                    </TableCell>
                    <TableCell className="flex w-full items-center justify-center gap-2 text-center">
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

export default VehicleTable;
