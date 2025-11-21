import { useForm, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { store, index } from '@/routes/purchase-returns';
import InputError from '@/components/input-error';

interface Supplier {
    id: number;
    name: string;
}

interface Item {
    id: number;
    code: string;
    name: string;
}

interface ItemUom {
    id: number;
    uom_name: string;
}

interface PurchaseDetail {
    id: number;
    item: Item;
    item_uom: ItemUom;
    quantity: string;
    price: string;
    discount1_percent: string;
    discount2_percent: string;
}

interface Purchase {
    id: number;
    purchase_number: string;
    supplier?: Supplier;
    purchase_date: string;
    ppn_percent: string;
    details: PurchaseDetail[];
}

interface Bank {
    id: number;
    name: string;
}

interface PurchaseReturnFormProps {
    purchases: Purchase[];
    returnedQuantities?: { [key: number]: number };
    banks?: Bank[];
}

interface ReturnItemDetail {
    purchase_detail_id: number;
    item_id: number;
    item_uom_id: number;
    quantity: string;
    max_quantity: string;
    price: string;
    discount1_percent: string;
    discount2_percent: string;
    selected: boolean;
}

interface PurchaseReturnFormData {
    purchase_id: string;
    return_date: string;
    return_type: string;
    refund_bank_id: string;
    refund_method: string;
    ppn_percent: string;
    reason: string;
    details: any[];
}

export default function PurchaseReturnForm({ purchases, returnedQuantities = {}, banks = [] }: PurchaseReturnFormProps) {
    const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>('');
    const [returnItems, setReturnItems] = useState<ReturnItemDetail[]>([]);

    const form = useForm<PurchaseReturnFormData>({
        purchase_id: '',
        return_date: new Date().toISOString().split('T')[0],
        return_type: 'stock_only',
        refund_bank_id: '',
        refund_method: 'reduce_payable',
        ppn_percent: '0',
        reason: '',
        details: [],
    });

    const selectedPurchase = useMemo(() => {
        return purchases.find((p) => p.id.toString() === selectedPurchaseId);
    }, [selectedPurchaseId, purchases]);

    const handlePurchaseChange = (purchaseId: string) => {
        setSelectedPurchaseId(purchaseId);
        form.setData('purchase_id', purchaseId);

        const purchase = purchases.find((p) => p.id.toString() === purchaseId);
        if (purchase) {
            // Initialize return items from purchase details
            const items: ReturnItemDetail[] = purchase.details.map((detail) => {
                const originalQuantity = parseFloat(detail.quantity);
                const returnedQty = returnedQuantities[detail.id] || 0;
                const remainingQty = originalQuantity - returnedQty;

                return {
                    purchase_detail_id: detail.id,
                    item_id: detail.item.id,
                    item_uom_id: detail.item_uom.id,
                    quantity: remainingQty > 0 ? remainingQty.toString() : '0',
                    max_quantity: remainingQty > 0 ? remainingQty.toString() : '0',
                    price: detail.price,
                    discount1_percent: detail.discount1_percent,
                    discount2_percent: detail.discount2_percent,
                    selected: false,
                };
            });
            setReturnItems(items);
            form.setData('ppn_percent', purchase.ppn_percent);
        }
    };

    const handleToggleItem = (index: number) => {
        const newItems = [...returnItems];
        newItems[index].selected = !newItems[index].selected;
        setReturnItems(newItems);
    };

    const handleQuantityChange = (index: number, value: string) => {
        const newItems = [...returnItems];
        const numValue = parseFloat(value) || 0;
        const maxQty = parseFloat(newItems[index].max_quantity);

        if (numValue > maxQty) {
            toast.error(`Quantity tidak boleh lebih dari ${maxQty}`);
            return;
        }

        newItems[index].quantity = value;
        setReturnItems(newItems);
    };

    // Calculate totals
    const calculations = useMemo(() => {
        let subtotal = 0;
        let totalDiscount1Amount = 0;
        let totalDiscount2Amount = 0;

        const selectedItems = returnItems.filter((item) => item.selected);

        selectedItems.forEach((item) => {
            const qty = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.price) || 0;
            const disc1Pct = parseFloat(item.discount1_percent) || 0;
            const disc2Pct = parseFloat(item.discount2_percent) || 0;

            const amount = qty * price;
            const disc1Amt = (amount * disc1Pct) / 100;
            const afterDisc1 = amount - disc1Amt;
            const disc2Amt = (afterDisc1 * disc2Pct) / 100;

            subtotal += amount;
            totalDiscount1Amount += disc1Amt;
            totalDiscount2Amount += disc2Amt;
        });

        const headerDisc1Amt = totalDiscount1Amount;
        const afterHeaderDisc1 = subtotal - headerDisc1Amt;

        const headerDisc2Amt = totalDiscount2Amount;
        const totalAfterDiscount = afterHeaderDisc1 - headerDisc2Amt;

        const ppnPct = parseFloat(form.data.ppn_percent) || 0;
        const ppnAmt = (totalAfterDiscount * ppnPct) / 100;
        const grandTotal = totalAfterDiscount + ppnAmt;

        return {
            subtotal,
            headerDisc1Amt,
            headerDisc2Amt,
            totalAfterDiscount,
            ppnAmt,
            grandTotal,
        };
    }, [returnItems, form.data.ppn_percent]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const selectedItems = returnItems.filter((item) => item.selected);

        if (selectedItems.length === 0) {
            toast.error('Pilih minimal 1 item untuk diretur');
            return;
        }

        const details = selectedItems.map((item) => ({
            purchase_detail_id: item.purchase_detail_id,
            item_id: item.item_id,
            item_uom_id: item.item_uom_id,
            quantity: parseFloat(item.quantity),
            price: parseFloat(item.price),
            discount1_percent: parseFloat(item.discount1_percent) || 0,
            discount2_percent: parseFloat(item.discount2_percent) || 0,
        }));

        // Set details first, then post
        form.setData('details', details);

        form.post(store().url, {
            onSuccess: () => {
                toast.success('Retur pembelian berhasil ditambahkan');
            },
            onError: () => {
                toast.error('Gagal menambahkan retur pembelian');
            },
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Informasi Retur</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="purchase_id">
                                Pilih Pembelian <span className="text-red-500">*</span>
                            </Label>
                            <Select value={selectedPurchaseId} onValueChange={handlePurchaseChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih pembelian yang akan diretur..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {purchases.map((purchase) => (
                                        <SelectItem key={purchase.id} value={purchase.id.toString()}>
                                            {purchase.purchase_number} - {purchase.supplier?.name} ({new Date(purchase.purchase_date).toLocaleDateString('id-ID')})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.purchase_id} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="return_date">
                                Tanggal Retur <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="return_date"
                                type="date"
                                value={form.data.return_date}
                                onChange={(e) => { form.setData('return_date', e.target.value); }}
                                required
                            />
                            <InputError message={form.errors.return_date} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="return_type">
                                Tipe Retur <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={form.data.return_type}
                                onValueChange={(value) => {
                                    form.setData('return_type', value);
                                    if (value === 'stock_only') {
                                        form.setData('refund_bank_id', '');
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih tipe retur" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="stock_only">Retur Stok Saja</SelectItem>
                                    <SelectItem value="stock_and_refund">Retur Stok + Refund (Potong Hutang/Terima Uang)</SelectItem>
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.return_type} />
                        </div>

                        {form.data.return_type === 'stock_and_refund' && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="refund_method">
                                        Metode Refund <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        value={form.data.refund_method}
                                        onValueChange={(value) => {
                                            form.setData('refund_method', value);
                                            if (value === 'reduce_payable') {
                                                form.setData('refund_bank_id', '');
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih metode refund" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="reduce_payable">Kurangi Hutang (Otomatis)</SelectItem>
                                            <SelectItem value="cash_refund">Terima Uang (Cash Refund via Bank)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={form.errors.refund_method} />
                                </div>

                                {form.data.refund_method === 'cash_refund' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="refund_bank_id">
                                            Bank untuk Refund <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={form.data.refund_bank_id || undefined}
                                            onValueChange={(value) => {
                                                form.setData('refund_bank_id', value);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih bank" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {banks && banks.length > 0 && banks.map((bank) => (
                                                    <SelectItem key={bank.id} value={bank.id.toString()}>
                                                        {bank.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={form.errors.refund_bank_id} />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Items Selection Table */}
            {selectedPurchase && (
                <Card>
                    <CardHeader>
                        <CardTitle>Pilih Items yang Diretur</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">Pilih</TableHead>
                                        <TableHead className="w-[100px]">Kode</TableHead>
                                        <TableHead>Nama Item</TableHead>
                                        <TableHead>UOM</TableHead>
                                        <TableHead className="text-right">Qty Awal</TableHead>
                                        <TableHead className="text-right">Qty Retur</TableHead>
                                        <TableHead className="text-right">Harga</TableHead>
                                        <TableHead className="text-right">Disc 1</TableHead>
                                        <TableHead className="text-right">Disc 2</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {returnItems.map((item, index) => {
                                        const detail = selectedPurchase.details[index];
                                        const originalQuantity = parseFloat(detail.quantity);
                                        const returnedQty = returnedQuantities[detail.id] || 0;
                                        const remainingQty = originalQuantity - returnedQty;
                                        const isFullyReturned = remainingQty <= 0;

                                        return (
                                            <TableRow key={index} className={isFullyReturned ? 'opacity-50' : ''}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={item.selected}
                                                        onCheckedChange={() => !isFullyReturned && handleToggleItem(index)}
                                                        disabled={isFullyReturned}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-mono">{detail.item.code}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <span>{detail.item.name}</span>
                                                        {returnedQty > 0 && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Sudah direfund: {returnedQty.toLocaleString('id-ID')}
                                                            </Badge>
                                                        )}
                                                        {isFullyReturned && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                Sudah direfund sepenuhnya
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{detail.item_uom.uom_name}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div>
                                                        <div>{parseFloat(item.max_quantity).toLocaleString('id-ID')}</div>
                                                        {returnedQty > 0 && (
                                                            <div className="text-xs text-muted-foreground">
                                                                dari {originalQuantity.toLocaleString('id-ID')}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0.01"
                                                        max={item.max_quantity}
                                                        value={item.quantity}
                                                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                        className="w-24 text-right"
                                                        disabled={!item.selected || isFullyReturned}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">{formatCurrency(parseFloat(item.price))}</TableCell>
                                                <TableCell className="text-right text-red-600">
                                                    {parseFloat(item.discount1_percent) > 0 ? `${item.discount1_percent}%` : '-'}
                                                </TableCell>
                                                <TableCell className="text-right text-red-600">
                                                    {parseFloat(item.discount2_percent) > 0 ? `${item.discount2_percent}%` : '-'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Totals & Footer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Alasan Retur</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Alasan</Label>
                            <Textarea
                                id="reason"
                                value={form.data.reason}
                                onChange={(e) => { form.setData('reason', e.target.value); }}
                                rows={4}
                                placeholder="Alasan retur (optional)"
                            />
                        </div>
                        <div className="space-y-2 pt-2 border-t">
                            <div className="text-sm text-muted-foreground">
                                💡 <strong>Info:</strong> Pilih items yang akan diretur dan atur quantity-nya
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Total Retur</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal (sebelum diskon):</span>
                            <span className="font-medium">{formatCurrency(calculations.subtotal)}</span>
                        </div>
                        {calculations.headerDisc1Amt > 0 && (
                            <div className="flex justify-between text-sm text-red-600">
                                <span>Total Diskon 1:</span>
                                <span>-{formatCurrency(calculations.headerDisc1Amt)}</span>
                            </div>
                        )}
                        {calculations.headerDisc2Amt > 0 && (
                            <div className="flex justify-between text-sm text-red-600">
                                <span>Total Diskon 2:</span>
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
                            <span>TOTAL RETUR:</span>
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
                            <Button type="submit" disabled={form.processing || !selectedPurchaseId} className="flex-1">
                                {form.processing ? 'Menyimpan...' : 'Simpan Retur'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </form>
    );
}

