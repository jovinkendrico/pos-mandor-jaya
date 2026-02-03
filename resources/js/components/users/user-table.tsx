import { User } from '@/types';
import { Edit, Trash } from 'lucide-react';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface PageProps {
    users: User[];
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
}

export default function UserTable({ users, onEdit, onDelete }: PageProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="text-center">#</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Cabang</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user, index) => (
                    <TableRow key={user.id}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="text-center">
                            {user.branch ? user.branch.name : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                            <Button variant="ghost" size="icon" onClick={() => onEdit(user)}>
                                <Edit />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => onDelete(user)}>
                                <Trash className="text-destructive" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
