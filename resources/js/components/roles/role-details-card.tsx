import InputError from '@/components/input-error';
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useForm } from '@inertiajs/react';

interface RoleFormData {
    name: string;
    guard_name: string;
    permissions_ids: number[];
}

interface RoleDetailsCardProps {
    form: ReturnType<typeof useForm<RoleFormData>>;
}

export default function RoleDetailsCard({ form }: RoleDetailsCardProps) {
    return (
        <Card>
            <CardContent className="space-y-4">
                <div className="flex flex-col gap-2 pt-4 lg:flex-row">
                    <div className="w-full items-center lg:w-1/2">
                        <CardTitle>Detail Role</CardTitle>
                        <CardDescription>
                            Masukkan informasi dasar untuk role baru
                        </CardDescription>
                    </div>
                    <div className="flex w-full flex-row gap-2 lg:w-1/2">
                        <div className="w-3/5 lg:w-4/5">
                            <Label htmlFor="name">Nama</Label>
                            <Input
                                id="name"
                                name="name"
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                                required
                            />
                            {form.errors.name && (
                                <InputError message={form.errors.name} />
                            )}
                        </div>
                        <div className="w-2/5 lg:w-1/5">
                            <Label htmlFor="guard_name">Guard</Label>
                            <Select
                                name="guard_name"
                                value={form.data.guard_name}
                                onValueChange={(value) =>
                                    form.setData('guard_name', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih guard" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="web">Web</SelectItem>
                                    <SelectItem value="api">API</SelectItem>
                                </SelectContent>
                            </Select>
                            {form.errors.guard_name && (
                                <InputError message={form.errors.guard_name} />
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
