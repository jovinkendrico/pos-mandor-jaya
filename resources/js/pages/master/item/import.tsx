import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import items, { index } from '@/routes/items';
import { BreadcrumbItem, PageProps as InertiaPageProps } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Download, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master',
        href: '#',
    },
    {
        title: 'Barang',
        href: index().url,
    },
    {
        title: 'Import',
        href: '#',
    },
];

const ItemImport = () => {
    const { flash } = usePage<InertiaPageProps>().props;
    const [file, setFile] = useState<File | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        file: null as File | null,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setData('file', selectedFile);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            toast.error('Pilih file Excel terlebih dahulu');
            return;
        }

        post(items.import.store().url, {
            forceFormData: true,
            onSuccess: () => {
                toast.success('Import berhasil!');
                reset();
                setFile(null);
            },
            onError: () => {
                toast.error('Import gagal. Periksa file Excel Anda.');
            },
        });
    };

    const downloadTemplate = () => {
        window.location.href = '/items/import/template';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Import Barang" />
            <div className="mb-4 flex items-center gap-2">
                <Link href={index().url}>
                    <ArrowLeft className="h-8 w-8" />
                </Link>
                <PageTitle title="Import Barang" />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="content">
                    <CardHeader>
                        <CardTitle>Upload File Excel</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="file">File Excel (.xlsx atau .xls)</Label>
                                <Input
                                    id="file"
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                    disabled={processing}
                                />
                                <InputError message={errors.file} />
                                {file && (
                                    <p className="text-sm text-muted-foreground">
                                        File dipilih: {file.name}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={processing || !file}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    {processing ? 'Mengimport...' : 'Import'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => {
                                        reset();
                                        setFile(null);
                                    }}
                                    disabled={processing}
                                >
                                    Reset
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card className="content">
                    <CardHeader>
                        <CardTitle>Format Excel</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="mb-2 text-sm text-muted-foreground">
                                File Excel harus memiliki kolom berikut:
                            </p>
                            <ul className="list-inside list-disc space-y-1 text-sm">
                                <li>
                                    <strong>name</strong> (wajib) - Nama barang
                                </li>
                                <li>
                                    <strong>description</strong> (opsional) -
                                    Deskripsi (hanya perlu diisi di baris pertama untuk setiap item)
                                </li>
                                <li>
                                    <strong>initial_stock</strong> (opsional) - Stok awal
                                    (hanya perlu diisi di baris pertama untuk setiap item)
                                </li>
                                <li>
                                    <strong>modal_price</strong> (opsional) -
                                    Harga modal (wajib jika initial_stock &gt; 0, hanya di baris pertama)
                                </li>
                                <li>
                                    <strong>uom_name</strong> (wajib) - Nama UOM
                                    (akan dibuat jika belum ada)
                                </li>
                                <li>
                                    <strong>conversion_value</strong> (wajib) -
                                    Nilai konversi ke base UOM (min: 1)
                                </li>
                                <li>
                                    <strong>price</strong> (wajib) - Harga jual untuk UOM ini
                                </li>
                                <li>
                                    <strong>is_base</strong> (wajib) - Apakah ini base UOM?
                                    (true/false atau 1/0, setiap item harus punya tepat 1 base UOM)
                                </li>
                            </ul>
                            <div className="mt-3 rounded-lg bg-blue-50 p-3 text-xs">
                                <p className="mb-2 font-semibold text-blue-900">
                                    💡 Tips: Satu item bisa punya banyak UOM
                                </p>
                                <p className="text-blue-800">
                                    Untuk item yang sama, buat beberapa baris dengan nama yang sama.
                                    Baris pertama berisi info item (name, description, initial_stock, modal_price).
                                    Baris berikutnya untuk UOM tambahan cukup isi name dan data UOM.
                                    Setiap item harus memiliki tepat 1 base UOM (is_base = true).
                                </p>
                            </div>
                        </div>

                        <div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={downloadTemplate}
                                className="w-full"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download Template Excel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
};

export default ItemImport;

