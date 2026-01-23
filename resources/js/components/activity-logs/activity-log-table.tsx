import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ActivityLog } from '@/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Eye } from 'lucide-react';
import { Button } from '../ui/button';

interface ActivityLogTableProps {
    logs: {
        data: ActivityLog[];
    };
    onShowDetail: (log: ActivityLog) => void;
}

export default function ActivityLogTable({
    logs,
    onShowDetail,
}: ActivityLogTableProps) {
    const getActionBadgeColor = (action: string) => {
        switch (action) {
            case 'created':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
            case 'updated':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
            case 'deleted':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
        }
    };

    const formatModelName = (modelType: string) => {
        return modelType.split('\\').pop() || modelType;
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Waktu</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Aksi</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.data.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={7}
                                className="h-24 text-center"
                            >
                                No activity logs found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        logs.data.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="whitespace-nowrap">
                                    {format(
                                        new Date(log.created_at),
                                        'dd MMM yyyy, HH:mm:ss',
                                        { locale: id }
                                    )}
                                </TableCell>
                                <TableCell>
                                    {log.user?.name || 'System'}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        className={getActionBadgeColor(
                                            log.action
                                        )}
                                        variant="outline"
                                    >
                                        {log.action.toUpperCase()}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {formatModelName(log.model_type)}
                                </TableCell>
                                <TableCell>{log.model_id}</TableCell>
                                <TableCell>{log.ip_address}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onShowDetail(log)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
