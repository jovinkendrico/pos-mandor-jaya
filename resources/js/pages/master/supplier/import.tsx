import PageTitle from '@/components/page-title';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import suppliers, { index } from '@/routes/suppliers';
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
        title: 'Supplier',
        href: index().url,
    },
    {
        title: 'Import',
        href: '#',
    },
];

const SupplierImport = () => {
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

        post(suppliers.import.store().url, {
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
        window.location.href = '/suppliers/import/template';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Import Supplier" />
            <div className="mb-4 flex items-center gap-2">
                <Link href={index().url}>
                    <ArrowLeft className="h-8 w-8" />
                </Link>
                <PageTitle title="Import Supplier" />
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
                                    <strong>name</strong> (wajib) - Nama supplier
                                </li>
                                <li>
                                    <strong>address</strong> (opsional) - Alamat
                                </li>
                                <li>
                                    <strong>city_name</strong> (opsional) - Nama
                                    kota (akan dibuat jika belum ada)
                                </li>
                                <li>
                                    <strong>phone_number</strong> (opsional) -
                                    Nomor telepon
                                </li>
                                <li>
                                    <strong>contact_person</strong> (opsional) -
                                    Contact person
                                </li>
                            </ul>
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

export default SupplierImport;

