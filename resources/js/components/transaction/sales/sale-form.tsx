import { useForm } from '@inertiajs/react';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Trash2, Plus } from 'lucide-react';
import { store, update, index } from '@/routes/sales';
import InputError from '@/components/input-error';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import axios from 'axios';
import { store as storeCustomer } from '@/routes/customers';
import { store as storeCity } from '@/routes/cities';

interface Customer {
    id: number;
    name: string;
}

interface City {
    id: number;
    name: string;
}

interface ItemUom {
    id: number;
    uom_name: string;
    price: string;
    conversion_value: number;
}

interface Item {
    id: number;
    code: string;
    name: string;
    stock: string;
    uoms: ItemUom[];
}

interface SaleDetail {
    item_id: string;
    item_uom_id: string;
    quantity: string;
    price: string;
    discount1_percent: string;
    discount2_percent: string;
}

interface Sale {
    id: number;
    customer_id?: number;
    sale_date: string;
    due_date?: string;
    discount1_percent: string;
    discount2_percent: string;
    ppn_percent: string;
    notes?: string;
    details: SaleDetail[];
}

interface SaleFormProps {
    sale?: Sale;
    customers: Customer[];
    items: Item[];
}

export default function SaleForm({ sale, customers, items }: SaleFormProps) {
    const [localCustomers, setLocalCustomers] = useState<Customer[]>(customers);
    const [isAddingCustomer, setIsAddingCustomer] = useState(false);
    const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
    const [cities, setCities] = useState<City[]>([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const [isAddCityModalOpen, setIsAddCityModalOpen] = useState(false);
    const [newCityName, setNewCityName] = useState('');
    const [isAddingCity, setIsAddingCity] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        address: '',
        city_id: '',
        phone_number: '',
        contact_person: '',
    });

    const form = useForm({
        customer_id: sale?.customer_id?.toString() || '',
        sale_date: sale?.sale_date || new Date().toISOString().split('T')[0],
        due_date: sale?.due_date || '',
        ppn_percent: sale?.ppn_percent || '0',
        notes: sale?.notes || '',
        details: sale?.details || [
            {
                item_id: '',
                item_uom_id: '',
                quantity: '1',
                price: '0',
                discount1_percent: '0',
                discount2_percent: '0',
            },
        ],
    });

    useEffect(() => {
        setLocalCustomers(customers);
    }, [customers]);

    // Load cities when add customer modal opens
    useEffect(() => {
        if (isAddCustomerModalOpen && cities.length === 0) {
            setLoadingCities(true);
            axios.get('/cities?limit=10')
                .then((response) => {
                    if (response.data && response.data.data) {
                        setCities(response.data.data);
                    }
                })
                .catch(() => {
                    toast.error('Gagal memuat data kota');
                })
                .finally(() => {
                    setLoadingCities(false);
                });
        }
    }, [isAddCustomerModalOpen]);

    const customerOptions: ComboboxOption[] = useMemo(() => {
        return localCustomers.map((customer) => ({
            value: customer.id.toString(),
            label: customer.name,
        }));
    }, [localCustomers]);

    const cityOptions: ComboboxOption[] = useMemo(() => {
        return cities.map((city) => ({
            value: city.id.toString(),
            label: city.name,
        }));
    }, [cities]);

    const handleAddCity = async () => {
        if (!newCityName.trim()) {
            toast.error('Nama kota tidak boleh kosong');
            return;
        }

        setIsAddingCity(true);

        try {
            const response = await axios.post(storeCity().url, {
                name: newCityName,
            });

            if (response.data && response.data.data) {
                const city = response.data.data;
                setCities((prev) => [...prev, city]);
                setNewCustomer((prev) => ({ ...prev, city_id: city.id.toString() }));
                toast.success('Kota berhasil ditambahkan');
                setNewCityName('');
                setIsAddCityModalOpen(false);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal menambahkan kota');
        } finally {
            setIsAddingCity(false);
        }
    };

    const handleAddCustomer = async () => {
        if (!newCustomer.name.trim()) {
            toast.error('Nama customer tidak boleh kosong');
            return;
        }

        setIsAddingCustomer(true);

        try {
            const response = await axios.post(storeCustomer().url, newCustomer);

            if (response.data && response.data.data) {
                const cust = response.data.data;
                setLocalCustomers((prev) => [...prev, cust]);
                form.setData('customer_id', cust.id.toString());
                toast.success('Customer berhasil ditambahkan');
                setNewCustomer({
                    name: '',
                    address: '',
                    city_id: '',
                    phone_number: '',
                    contact_person: '',
                });
                setIsAddCustomerModalOpen(false);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal menambahkan customer');
        } finally {
            setIsAddingCustomer(false);
        }
    };

    const handleAddItem = () => {
        form.setData('details', [
            ...form.data.details,
            {
                item_id: '',
                item_uom_id: '',
                quantity: '1',
                price: '0',
                discount1_percent: '0',
                discount2_percent: '0',
            },
        ]);
    };

    const handleRemoveItem = (index: number) => {
        if (form.data.details.length === 1) {
            toast.error('Minimal harus ada 1 item');
            return;
        }
        const newDetails = form.data.details.filter((_, i) => i !== index);
        form.setData('details', newDetails);
    };

    const handleItemChange = (index: number, field: keyof SaleDetail, value: string) => {
        const newDetails = [...form.data.details];
        newDetails[index] = { ...newDetails[index], [field]: value };

        // Auto-fill price from item UOM when UOM selected
        if (field === 'item_uom_id') {
            const selectedItem = items.find((item) => item.id.toString() === newDetails[index].item_id);
            const selectedUom = selectedItem?.uoms.find((uom) => uom.id.toString() === value);
            if (selectedUom) {
                newDetails[index].price = selectedUom.price;
            }
        }

        form.setData('details', newDetails);
    };

    // Calculate totals
    const calculations = useMemo(() => {
        let subtotal = 0;
        let totalDiscount1Amount = 0;
        let totalDiscount2Amount = 0;

        // Calculate each item with its discounts
        const itemsCalculated = form.data.details.map((detail) => {
            const qty = parseFloat(detail.quantity) || 0;
            const price = parseFloat(detail.price) || 0;
            const disc1Pct = parseFloat(detail.discount1_percent) || 0;
            const disc2Pct = parseFloat(detail.discount2_percent) || 0;

            const amount = qty * price;
            const disc1Amt = (amount * disc1Pct) / 100;
            const afterDisc1 = amount - disc1Amt;
            const disc2Amt = (afterDisc1 * disc2Pct) / 100;
            const itemSubtotal = afterDisc1 - disc2Amt;

            return { amount, disc1Amt, disc2Amt, subtotal: itemSubtotal };
        });

        // Sum all amounts and discounts
        itemsCalculated.forEach((item) => {
            subtotal += item.amount;
            totalDiscount1Amount += item.disc1Amt;
            totalDiscount2Amount += item.disc2Amt;
        });

        // Header discounts (calculated from items)
        const headerDisc1Amt = totalDiscount1Amount;
        const afterHeaderDisc1 = subtotal - headerDisc1Amt;

        const headerDisc2Amt = totalDiscount2Amount;
        const totalAfterDiscount = afterHeaderDisc1 - headerDisc2Amt;

        // PPN
        const ppnPct = parseFloat(form.data.ppn_percent) || 0;
        const ppnAmt = (totalAfterDiscount * ppnPct) / 100;
        const grandTotal = totalAfterDiscount + ppnAmt;

        return {
            itemsCalculated,
            subtotal,
            headerDisc1Amt,
            headerDisc2Amt,
            totalAfterDiscount,
            ppnAmt,
            grandTotal,
        };
    }, [form.data.details, form.data.ppn_percent]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (form.data.details.length === 0) {
            toast.error('Minimal harus ada 1 item');
            return;
        }

        const hasEmptyItem = form.data.details.some(
            (d) => !d.item_id || !d.item_uom_id || !d.quantity || !d.price
        );
        if (hasEmptyItem) {
            toast.error('Semua item harus diisi lengkap');
            return;
        }

        if (sale) {
            form.put(update(sale.id).url, {
                onSuccess: () => {
                    toast.success('Penjualan berhasil diperbarui');
                },
                onError: () => {
                    toast.error('Gagal memperbarui penjualan');
                },
            });
        } else {
            form.post(store().url, {
                onSuccess: () => {
                    toast.success('Penjualan berhasil ditambahkan');
                },
                onError: () => {
                    toast.error('Gagal menambahkan penjualan');
                },
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Informasi Penjualan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="customer_id">Customer</Label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Combobox
                                        options={customerOptions}
                                        value={form.data.customer_id}
                                        onValueChange={(value) => form.setData('customer_id', value)}
                                        placeholder="Pilih customer..."
                                        searchPlaceholder="Cari customer..."
                                        className="w-full"
                                        maxDisplayItems={5}
                                    />
                                    <InputError message={form.errors.customer_id} />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setIsAddCustomerModalOpen(true)}
                                    title="Tambah customer baru"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sale_date">
                                Tanggal Penjualan <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="sale_date"
                                type="date"
                                value={form.data.sale_date}
                                onChange={(e) => form.setData('sale_date', e.target.value)}
                                required
                            />
                            <InputError message={form.errors.sale_date} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="due_date">Tanggal Jatuh Tempo</Label>
                            <Input
                                id="due_date"
                                type="date"
                                value={form.data.due_date}
                                onChange={(e) => form.setData('due_date', e.target.value)}
                                min={form.data.sale_date}
                            />
                            <InputError message={form.errors.due_date} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Items Table */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Detail Items</CardTitle>
                        <Button type="button" onClick={handleAddItem} size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Item
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px]">Item</TableHead>
                                    <TableHead className="w-[120px]">UOM</TableHead>
                                    <TableHead className="w-[100px]">Qty</TableHead>
                                    <TableHead className="w-[130px]">Harga</TableHead>
                                    <TableHead className="w-[100px]">Disc 1%</TableHead>
                                    <TableHead className="w-[100px]">Disc 2%</TableHead>
                                    <TableHead className="text-right w-[130px]">Subtotal</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {form.data.details.map((detail, index) => {
                                    const selectedItem = items.find((item) => item.id.toString() === detail.item_id);
                                    const itemCalc = calculations.itemsCalculated[index];

                                    return (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Select
                                                    value={detail.item_id}
                                                    onValueChange={(value) => {
                                                        handleItemChange(index, 'item_id', value);
                                                        // Reset UOM when item changes
                                                        handleItemChange(index, 'item_uom_id', '');
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih item" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {items.map((item) => (
                                                            <SelectItem key={item.id} value={item.id.toString()}>
                                                                {item.code} - {item.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={detail.item_uom_id}
                                                    onValueChange={(value) => handleItemChange(index, 'item_uom_id', value)}
                                                    disabled={!detail.item_id}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="UOM" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {selectedItem?.uoms.map((uom) => (
                                                            <SelectItem key={uom.id} value={uom.id.toString()}>
                                                                {uom.uom_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    value={detail.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                    className="text-right"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={detail.price}
                                                    onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                                                    className="text-right"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="100"
                                                    value={detail.discount1_percent}
                                                    onChange={(e) => handleItemChange(index, 'discount1_percent', e.target.value)}
                                                    className="text-right"
                                                    placeholder="0"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="100"
                                                    value={detail.discount2_percent}
                                                    onChange={(e) => handleItemChange(index, 'discount2_percent', e.target.value)}
                                                    className="text-right"
                                                    placeholder="0"
                                                />
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(itemCalc?.subtotal || 0)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => handleRemoveItem(index)}
                                                    disabled={form.data.details.length === 1}
                                                    className="text-red-500"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Totals & Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Pajak & Catatan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="ppn_percent">PPN %</Label>
                            <Input
                                id="ppn_percent"
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={form.data.ppn_percent}
                                onChange={(e) => form.setData('ppn_percent', e.target.value)}
                                className="text-right"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Catatan</Label>
                            <Textarea
                                id="notes"
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                rows={4}
                            />
                        </div>
                        <div className="space-y-2 pt-2 border-t">
                            <div className="text-sm text-muted-foreground">
                                💡 <strong>Info:</strong> Diskon header otomatis dihitung dari total diskon semua items
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Total Penjualan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal (sebelum diskon):</span>
                            <span className="font-medium">{formatCurrency(calculations.subtotal)}</span>
                        </div>
                        {calculations.headerDisc1Amt > 0 && (
                            <div className="flex justify-between text-sm text-red-600">
                                <span>Total Diskon 1 (dari items):</span>
                                <span>-{formatCurrency(calculations.headerDisc1Amt)}</span>
                            </div>
                        )}
                        {calculations.headerDisc2Amt > 0 && (
                            <div className="flex justify-between text-sm text-red-600">
                                <span>Total Diskon 2 (dari items):</span>
                                <span>-{formatCurrency(calculations.headerDisc2Amt)}</span>
                            </div>
                        )}
                        {calculations.ppnAmt > 0 && (
                            <div className="flex justify-between text-sm text-blue-600">
                                <span>PPN ({form.data.ppn_percent}%):</span>
                                <span>+{formatCurrency(calculations.ppnAmt)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg border-t pt-3">
                            <span>GRAND TOTAL:</span>
                            <span className="text-primary">{formatCurrency(calculations.grandTotal)}</span>
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.visit(index().url)}
                                disabled={form.processing}
                                className="flex-1"
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={form.processing} className="flex-1">
                                {form.processing ? 'Menyimpan...' : sale ? 'Update' : 'Simpan'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dialog for adding new customer */}
            <Dialog open={isAddCustomerModalOpen} onOpenChange={setIsAddCustomerModalOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Tambah Customer Baru</DialogTitle>
                        <DialogDescription>Isi data detail untuk menambahkan customer baru</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="new_customer_name">
                                Nama Customer <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="new_customer_name"
                                value={newCustomer.name}
                                onChange={(e) => setNewCustomer((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="Masukkan nama customer"
                            />
                        </div>

                        <div>
                            <Label htmlFor="new_customer_address">Alamat</Label>
                            <Textarea
                                id="new_customer_address"
                                value={newCustomer.address}
                                onChange={(e) => setNewCustomer((prev) => ({ ...prev, address: e.target.value }))}
                                placeholder="Masukkan alamat"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="new_customer_city">Kota</Label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <Combobox
                                            options={cityOptions}
                                            value={newCustomer.city_id}
                                            onValueChange={(value) => setNewCustomer((prev) => ({ ...prev, city_id: value }))}
                                            placeholder={loadingCities ? 'Memuat kota...' : 'Pilih kota...'}
                                            searchPlaceholder="Cari kota..."
                                            className="w-full"
                                            maxDisplayItems={10}
                                            disabled={loadingCities}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setIsAddCityModalOpen(true)}
                                        title="Tambah kota baru"
                                        disabled={loadingCities}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="new_customer_phone">Nomor Telepon</Label>
                                <Input
                                    id="new_customer_phone"
                                    value={newCustomer.phone_number}
                                    onChange={(e) => setNewCustomer((prev) => ({ ...prev, phone_number: e.target.value }))}
                                    placeholder="08123456789"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="new_customer_contact">Contact Person</Label>
                            <Input
                                id="new_customer_contact"
                                value={newCustomer.contact_person}
                                onChange={(e) => setNewCustomer((prev) => ({ ...prev, contact_person: e.target.value }))}
                                placeholder="Nama contact person"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setIsAddCustomerModalOpen(false);
                                setNewCustomer({
                                    name: '',
                                    address: '',
                                    city_id: '',
                                    phone_number: '',
                                    contact_person: '',
                                });
                            }}
                            disabled={isAddingCustomer}
                        >
                            Batal
                        </Button>
                        <Button type="button" onClick={handleAddCustomer} disabled={isAddingCustomer}>
                            {isAddingCustomer ? 'Menambahkan...' : 'Tambah Customer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog for adding new city */}
            <Dialog open={isAddCityModalOpen} onOpenChange={setIsAddCityModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tambah Kota Baru</DialogTitle>
                        <DialogDescription>Masukkan nama kota yang ingin ditambahkan</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="new_city_name">Nama Kota</Label>
                        <Input
                            id="new_city_name"
                            value={newCityName}
                            onChange={(e) => setNewCityName(e.target.value)}
                            placeholder="Masukkan nama kota"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddCity();
                                }
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setIsAddCityModalOpen(false);
                                setNewCityName('');
                            }}
                            disabled={isAddingCity}
                        >
                            Batal
                        </Button>
                        <Button type="button" onClick={handleAddCity} disabled={isAddingCity}>
                            {isAddingCity ? 'Menambahkan...' : 'Tambah Kota'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </form>
    );
}

