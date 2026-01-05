import qz from 'qz-tray';

export const connectQz = async () => {
    if (qz.websocket.isActive()) return;

    try {
        // Mencoba koneksi ke port-port standar QZ Tray
        await qz.websocket.connect({
            host: 'localhost',
            port: { secure: [8181, 8282], insecure: [8182, 8283] }
        });
        console.log('QZ Tray connected');
    } catch (err) {
        console.error('QZ Tray connection failed', err);
        throw err;
    }
};

export const printRaw = async (data: string) => {
    try {
        // Mencoba koneksi ulang jika belum aktif
        if (!qz.websocket.isActive()) {
            await connectQz();
        }

        // Cari printer default
        const printer = await qz.printers.getDefault();
        if (!printer) {
            throw new Error('Printer default tidak ditemukan. Silakan set "Default Printer" di Windows.');
        }

        const config = qz.configs.create(printer);
        config.setEncoding('UTF-8');

        await qz.print(config, [data]);
    } catch (err: any) {
        console.error('Printing failed', err);
        // Berikan pesan error yang lebih jelas untuk diberitahukan ke USER
        if (err.message && err.message.includes('Permission denied')) {
            throw new Error('Izin ditolak oleh QZ Tray. Silakan klik "Allow" saat popup muncul.');
        }
        throw err;
    }
};
