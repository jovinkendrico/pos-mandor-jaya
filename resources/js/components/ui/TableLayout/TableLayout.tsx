import { ReactNode } from 'react';
import {
    Table,
    TableBody,
    TableCell,
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
        <Table className="content">
            <TableHeader>
                <TableRow className="flex w-full flex-row hover:!bg-transparent dark:border-secondary-300">
                    {tableColumn.map((column, index) => (
                        <TableHead
                            key={index}
                            className="flex w-full items-center justify-center text-center dark:text-secondary-500"
                        >
                            {column}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            {tableRow && tableRow.length !== 0 ? (
                <TableBody>
                    {tableRow.map((row, rowIndex) => (
                        <TableRow
                            key={rowIndex}
                            className="flex w-full flex-row"
                        >
                            {renderRow(row, rowIndex)}
                        </TableRow>
                    ))}
                </TableBody>
            ) : (
                <TableBody>
                    <TableRow className="hover:!bg-transparent">
                        <TableCell className="flex min-h-120 w-full flex-col items-center justify-center align-middle">
                            <img
                                src="folder-image-vector.svg"
                                alt="no_vector_logo"
                                className="max-w-3xs opacity-65 dark:opacity-20"
                            />
                            <h1 className="mb-2 flex items-center justify-center text-3xl font-extrabold text-primary-800 dark:text-primary-800">
                                Data tidak ditemukan
                            </h1>
                            <p>{text ?? 'Tidak ada data'}</p>
                        </TableCell>
                    </TableRow>
                </TableBody>
            )}
        </Table>
    );
};

export default TableLayout;
