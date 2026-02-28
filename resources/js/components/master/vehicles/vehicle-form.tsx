import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import useVehicle from '@/hooks/use-vehicle';
import { IVehicle } from '@/types';
import { useEffect } from 'react';
import InputError from '../../input-error';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Checkbox } from '../../ui/checkbox';

interface VehicleFormProps {
    vehicle?: IVehicle;
    isModalOpen: boolean;
    onModalClose: () => void;
}

export default function VehicleForm(props: VehicleFormProps) {
    const { vehicle, isModalOpen, onModalClose } = props;

    const {
        data: dataVehicle,
        setData: setDataVehicle,
        errors: errorsVehicle,
        processing: processingVehicle,
        reset: resetVehicle,
        handleSubmit: handleSubmitVehicle,
        handleCancel: handleCancelVehicle,
    } = useVehicle(onModalClose);

    useEffect(() => {
        if (vehicle) {
            setDataVehicle({
                police_number: vehicle.police_number,
                name: vehicle.name || '',
                driver: vehicle.driver || '',
                is_active: vehicle.is_active,
                description: vehicle.description || '',
            });
        } else {
            resetVehicle();
        }
    }, [vehicle, isModalOpen, resetVehicle, setDataVehicle]);

    return (
        <Dialog open={isModalOpen} onOpenChange={onModalClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {vehicle ? 'Edit Kendaraan' : 'Tambah Kendaraan'}
                    </DialogTitle>
                    <DialogDescription>
                        {vehicle
                            ? 'Perbarui informasi kendaraan di bawah.'
                            : 'Isi detail kendaraan baru.'}
                    </DialogDescription>
                </DialogHeader>

                <form
                    className="flex flex-col space-y-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmitVehicle(vehicle);
                    }}
                >
                    <div className="flex flex-col space-y-4 pb-4">
                        <div>
                            <Label htmlFor="police_number" required>Nomor Polisi (BK)</Label>
                            <Input
                                id="police_number"
                                name="police_number"
                                value={dataVehicle.police_number}
                                onChange={(e) => setDataVehicle('police_number', e.target.value)}
                                className="input-box uppercase"
                                placeholder="BK 1234 XY"
                            />
                            {errorsVehicle.police_number && <InputError message={errorsVehicle.police_number} />}
                        </div>

                        <div>
                            <Label htmlFor="name">Nama Truk / Keterangan Singkat</Label>
                            <Input
                                id="name"
                                name="name"
                                value={dataVehicle.name}
                                onChange={(e) => setDataVehicle('name', e.target.value)}
                                className="input-box"
                                placeholder="Truk Engkel / Fuso"
                            />
                            {errorsVehicle.name && <InputError message={errorsVehicle.name} />}
                        </div>

                        <div>
                            <Label htmlFor="driver">Nama Supir</Label>
                            <Input
                                id="driver"
                                name="driver"
                                value={dataVehicle.driver}
                                onChange={(e) => setDataVehicle('driver', e.target.value)}
                                className="input-box"
                                placeholder="Nama Supir"
                            />
                            {errorsVehicle.driver && <InputError message={errorsVehicle.driver} />}
                        </div>

                        <div>
                            <Label htmlFor="description">Keterangan Tambahan</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={dataVehicle.description}
                                onChange={(e) => setDataVehicle('description', e.target.value)}
                                rows={3}
                                className="input-box"
                            />
                            {errorsVehicle.description && <InputError message={errorsVehicle.description} />}
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_active"
                                    checked={dataVehicle.is_active}
                                    onCheckedChange={(checked) => setDataVehicle('is_active', checked as boolean)}
                                />
                                <Label htmlFor="is_active">Aktif</Label>
                            </div>
                            {errorsVehicle.is_active && <InputError message={errorsVehicle.is_active} />}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCancelVehicle}
                            disabled={processingVehicle}
                            className="btn-secondary"
                        >
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            disabled={processingVehicle}
                            className="btn-primary"
                        >
                            {processingVehicle ? (
                                <Spinner />
                            ) : vehicle ? (
                                'Update Kendaraan'
                            ) : (
                                'Tambah Kendaraan'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
