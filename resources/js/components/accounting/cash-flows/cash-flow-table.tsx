import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ICashFlow } from '@/types';
import { Edit, Trash2 } from 'lucide-react';

interface CashFlowTableProps {
    cashFlows: ICashFlow[];
    onEdit: (cashFlow: ICashFlow) => void;
    onDelete: (cashFlow: ICashFlow) => void;
}

export default function CashFlowTable({ cashFlows, onEdit, onDelete }: CashFlowTableProps) {
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
                        <TableHead>Tipe</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Jumlah</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Referensi</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cashFlows.map((cashFlow) => (
                        <TableRow key={cashFlow.id}>
                            <TableCell>
                                <Badge variant={cashFlow.type === 'in' ? 'default' : 'secondary'}>
                                    {cashFlow.type === 'in' ? 'Cash In' : 'Cash Out'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {cashFlow.category?.name || '-'}
                            </TableCell>
                            <TableCell>
                                {cashFlow.description}
                            </TableCell>
                            <TableCell className={`font-medium ${
                                cashFlow.type === 'in' ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {cashFlow.type === 'in' ? '+' : '-'}{formatCurrency(cashFlow.amount)}
                            </TableCell>
                            <TableCell>
                                {cashFlow.bank?.name || '-'}
                            </TableCell>
                            <TableCell>
                                {new Date(cashFlow.transaction_date).toLocaleDateString('id-ID')}
                            </TableCell>
                            <TableCell>
                                {cashFlow.reference_type && cashFlow.reference_id ? (
                                    <Badge variant="outline">
                                        {cashFlow.reference_type} #{cashFlow.reference_id}
                                    </Badge>
                                ) : (
                                    <Badge variant="outline">Manual</Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onEdit(cashFlow)}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onDelete(cashFlow)}
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
