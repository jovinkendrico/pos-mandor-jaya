import TableLayout from '@/components/ui/TableLayout/TableLayout';
import { TableCell } from '@/components/ui/table';
import { UOM } from '@/types';

interface UOMTableProps {
    uoms: UOM[];
    onEdit?: (uom: UOM) => void;
    onDelete?: (uom: UOM) => void;
}

const UOMTable = (props: UOMTableProps) => {
    const { uoms } = props;

    const tableColumn = ['#', 'Name'];
    return (
        <TableLayout
            tableName="UOM"
            tableColumn={tableColumn}
            tableRow={uoms}
            text="Tidak ada data UOM"
            renderRow={(row) => (
                <>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.name}</TableCell>
                </>
            )}
        />
    );
};

export default UOMTable;
