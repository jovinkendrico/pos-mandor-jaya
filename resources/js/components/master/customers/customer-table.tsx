import { Edit, Trash } from 'lucide-react';
import { Button } from '../../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';

interface City {
    id: number;
    name: string;
}

interface Customer {
    id: number;
    name: string;
    address?: string;
    city?: City;
    phone_number?: string;
    contact?: string;
}

interface CustomerTableProps {
    customers: Customer[];
    onEdit: (customer: Customer) => void;
    onDelete: (customer: Customer) => void;
}

export default function CustomerTable({ customers, onEdit, onDelete }: CustomerTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="text-center">#</TableHead>
                    <TableHead>Nama Customer</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Kota</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {customers.map((customer, index) => (
                    <TableRow key={customer.id}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>{customer.address || '-'}</TableCell>
                        <TableCell>{customer.city?.name || '-'}</TableCell>
                        <TableCell>{customer.phone_number || '-'}</TableCell>
                        <TableCell>{customer.contact || '-'}</TableCell>
                        <TableCell className="text-center">
                            <Button variant="ghost" size="icon" onClick={() => onEdit(customer)}>
                                <Edit />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => onDelete(customer)}>
                                <Trash className="text-destructive" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

