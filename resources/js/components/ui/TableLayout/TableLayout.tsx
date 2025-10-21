import { ReactNode } from 'react';
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '../table';

interface PropTypes<T> {
    tableName?: string;
    tableColumn: string[];
    tableRow: T[];
    text?: string;
    renderRow: (row: T, rowIndex: number) => ReactNode;
}

const TableLayout = <T,>(props: PropTypes<T>) => {
    const { tableColumn, tableRow, text, renderRow } = props;
    return (
        <Table>
            <TableHeader>
                <TableRow className="flex w-full flex-row">
                    {tableColumn.map((column, index) => (
                        <TableHead
                            key={index}
                            className="flex w-full items-center justify-center"
                        >
                            {column}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {tableRow && tableRow.length !== 0 ? (
                    tableRow.map((row, rowIndex) => (
                        <TableRow
                            key={rowIndex}
                            className="flex w-full flex-row"
                        >
                            {renderRow(row, rowIndex)}
                        </TableRow>
                    ))
                ) : (
                    <TableRow className="flex w-full flex-row">
                        <TableHead className="flex w-full items-center justify-center">
                            {text ?? 'Tidak ada data'}
                        </TableHead>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

export default TableLayout;
