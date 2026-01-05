import qz from 'qz-tray';

export const connectQz = async () => {
    if (qz.websocket.isActive()) return;

    try {
        await qz.websocket.connect();
        console.log('QZ Tray connected');
    } catch (err) {
        console.error('QZ Tray connection failed', err);
        throw err;
    }
};

export const printRaw = async (data: string) => {
    try {
        // Cek koneksi
        if (!qz.websocket.isActive()) {
            await qz.websocket.connect();
        }

        // Cari printer default
        const printer = await qz.printers.getDefault();
        if (!printer) {
            throw new Error('Printer default tidak ditemukan. Silakan set "Default Printer" di Windows.');
        }

        const config = qz.configs.create(printer);
        // Tambahkan encoding agar support karakter spesial Dot Matrix
        config.setEncoding('UTF-8');

        await qz.print(config, [data]);
    } catch (err) {
        console.error('Printing failed', err);
        throw err;
    }
};

export const findPrinters = async () => {
    try {
        await connectQz();
        return await qz.printers.find();
    } catch (err) {
        console.error('Finding printers failed', err);
        throw err;
    }
};
