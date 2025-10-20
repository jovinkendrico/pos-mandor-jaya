import { Edit, Trash } from 'lucide-react';
import { Button } from '../../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';

interface City {
    id: number;
    name: string;
}

interface Supplier {
    id: number;
    name: string;
    address?: string;
    city?: City;
    phone_number?: string;
    contact?: string;
}

interface SupplierTableProps {
    suppliers: Supplier[];
    onEdit: (supplier: Supplier) => void;
    onDelete: (supplier: Supplier) => void;
}

export default function SupplierTable({ suppliers, onEdit, onDelete }: SupplierTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="text-center">#</TableHead>
                    <TableHead>Nama Supplier</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Kota</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {suppliers.map((supplier, index) => (
                    <TableRow key={supplier.id}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell>{supplier.name}</TableCell>
                        <TableCell>{supplier.address || '-'}</TableCell>
                        <TableCell>{supplier.city?.name || '-'}</TableCell>
                        <TableCell>{supplier.phone_number || '-'}</TableCell>
                        <TableCell>{supplier.contact || '-'}</TableCell>
                        <TableCell className="text-center">
                            <Button variant="ghost" size="icon" onClick={() => onEdit(supplier)}>
                                <Edit />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => onDelete(supplier)}>
                                <Trash className="text-destructive" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

