import { Edit, Trash } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';

interface Bank {
    id: number;
    name: string;
    type: 'bank' | 'cash';
    account_number?: string;
    account_name?: string;
    balance?: number;
    description?: string;
}

interface BankTableProps {
    banks: Bank[];
    onEdit: (bank: Bank) => void;
    onDelete: (bank: Bank) => void;
}

export default function BankTable({ banks, onEdit, onDelete }: BankTableProps) {
    const formatCurrency = (value?: number) => {
        if (!value) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="text-center">#</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead className="text-center">Tipe</TableHead>
                    <TableHead>No. Rekening</TableHead>
                    <TableHead>Nama Pemilik</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {banks.map((bank, index) => (
                    <TableRow key={bank.id}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell className="font-medium">{bank.name}</TableCell>
                        <TableCell className="text-center">
                            <Badge variant={bank.type === 'bank' ? 'default' : 'secondary'}>{bank.type === 'bank' ? 'Bank' : 'Cash'}</Badge>
                        </TableCell>
                        <TableCell>{bank.account_number || '-'}</TableCell>
                        <TableCell>{bank.account_name || '-'}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(bank.balance)}</TableCell>
                        <TableCell className="text-center">
                            <Button variant="ghost" size="icon" onClick={() => onEdit(bank)}>
                                <Edit />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => onDelete(bank)}>
                                <Trash className="text-destructive" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

