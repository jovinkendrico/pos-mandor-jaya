import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ICategory } from '@/types';
import { Edit, Trash2 } from 'lucide-react';

interface CategoryTableProps {
    categories: ICategory[];
    onEdit: (category: ICategory) => void;
    onDelete: (category: ICategory) => void;
}

export default function CategoryTable({ categories, onEdit, onDelete }: CategoryTableProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    return (
        <div className="bg-white rounded-lg shadow">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Kategori Induk</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {categories.map((category) => (
                        <TableRow key={category.id}>
                            <TableCell className="font-medium">
                                {category.name}
                            </TableCell>
                            <TableCell>
                                <Badge variant={category.type === 'income' ? 'default' : 'secondary'}>
                                    {category.type === 'income' ? 'Income' : 'Expense'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {category.parent?.name || '-'}
                            </TableCell>
                            <TableCell>
                                <Badge variant={category.is_active ? 'default' : 'destructive'}>
                                    {category.is_active ? 'Aktif' : 'Tidak Aktif'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {category.description || '-'}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onEdit(category)}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onDelete(category)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
