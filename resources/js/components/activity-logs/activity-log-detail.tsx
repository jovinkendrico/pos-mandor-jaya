import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ActivityLog } from '@/types';

interface ActivityLogDetailProps {
    log: ActivityLog | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ActivityLogDetail({
    log,
    isOpen,
    onOpenChange,
}: ActivityLogDetailProps) {
    if (!log) return null;

    const renderJson = (data: any) => {
        if (!data) return <span className="text-gray-400 italic">None</span>;
        return (
            <pre className="p-4 bg-gray-50 rounded-md text-xs overflow-auto dark:bg-gray-900">
                {JSON.stringify(data, null, 2)}
            </pre>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Detail Aktivitas #{log.id}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-4">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-semibold mb-1">User</h4>
                                <p className="text-sm">{log.user?.name || 'System'}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold mb-1">Aksi</h4>
                                <p className="text-sm capitalize">{log.action}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold mb-1">Model</h4>
                                <p className="text-sm">{log.model_type}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold mb-1">Model ID</h4>
                                <p className="text-sm">{log.model_id}</p>
                            </div>
                            <div className="col-span-2">
                                <h4 className="text-sm font-semibold mb-1">URL</h4>
                                <p className="text-sm break-all">{log.url}</p>
                            </div>
                            <div className="col-span-2">
                                <h4 className="text-sm font-semibold mb-1">User Agent</h4>
                                <p className="text-sm text-gray-500">{log.user_agent}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                                <h4 className="text-sm font-semibold mb-2">Paling Lama (Old)</h4>
                                {renderJson(log.old_values)}
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold mb-2">Paling Baru (New)</h4>
                                {renderJson(log.new_values)}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
