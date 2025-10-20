import { Edit, Trash } from 'lucide-react';
import { Button } from '../../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';

interface City {
    id: number;
    name: string;
}

interface CityTableProps {
    cities: City[];
    onEdit: (city: City) => void;
    onDelete: (city: City) => void;
}

export default function CityTable({ cities, onEdit, onDelete }: CityTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="text-center">#</TableHead>
                    <TableHead>Nama Kota</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {cities.map((city, index) => (
                    <TableRow key={city.id}>
                        <TableCell className="text-center">{index + 1}</TableCell>
                        <TableCell>{city.name}</TableCell>
                        <TableCell className="text-center">
                            <Button variant="ghost" size="icon" onClick={() => onEdit(city)}>
                                <Edit />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => onDelete(city)}>
                                <Trash className="text-destructive" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

