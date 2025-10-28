import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useForm } from '@inertiajs/react';
import { ICategory } from '@/types';
import { FormEventHandler, useEffect } from 'react';
import { store as storeCategory, update as updateCategory } from '@/routes/categories';

interface CategoryFormProps {
    isModalOpen: boolean;
    category?: ICategory;
    onModalClose: () => void;
}

export default function CategoryForm({ isModalOpen, category, onModalClose }: CategoryFormProps) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        type: 'expense' as 'income' | 'expense',
        parent_id: '',
        description: '',
        is_active: true,
    });

    useEffect(() => {
        if (category) {
            setData({
                name: category.name,
                type: category.type,
                parent_id: category.parent_id?.toString() || '',
                description: category.description || '',
                is_active: category.is_active,
            });
        } else {
            reset();
        }
    }, [category, isModalOpen]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        
        const formData = {
            ...data,
            parent_id: data.parent_id ? parseInt(data.parent_id) : null,
        };

        if (category) {
            updateCategory(category.id, formData);
        } else {
            storeCategory(formData);
        }
    };

    const handleClose = () => {
        reset();
        onModalClose();
    };

    if (!isModalOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h2 className="text-xl font-semibold mb-4">
                    {category ? 'Edit Kategori' : 'Tambah Kategori'}
                </h2>
                
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Nama Kategori</Label>
                        <Input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="type">Tipe Kategori</Label>
                        <Select
                            value={data.type}
                            onValueChange={(value) => setData('type', value as 'income' | 'expense')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih tipe kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="income">Income</SelectItem>
                                <SelectItem value="expense">Expense</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.type && (
                            <p className="text-red-500 text-sm mt-1">{errors.type}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="parent_id">Kategori Induk (Opsional)</Label>
                        <Select
                            value={data.parent_id}
                            onValueChange={(value) => setData('parent_id', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih kategori induk" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Tidak ada</SelectItem>
                                {/* TODO: Load parent categories based on type */}
                            </SelectContent>
                        </Select>
                        {errors.parent_id && (
                            <p className="text-red-500 text-sm mt-1">{errors.parent_id}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            rows={3}
                            className={errors.description ? 'border-red-500' : ''}
                        />
                        {errors.description && (
                            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="is_active"
                            checked={data.is_active}
                            onCheckedChange={(checked) => setData('is_active', checked)}
                        />
                        <Label htmlFor="is_active">Aktif</Label>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            className="btn-primary"
                            disabled={processing}
                        >
                            {processing ? 'Menyimpan...' : (category ? 'Update' : 'Simpan')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
