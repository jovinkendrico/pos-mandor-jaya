import qz from 'qz-tray';

let connected = false;

export const connectQz = async () => {
    if (connected) return;
    try {
        await qz.websocket.connect();
        connected = true;
        console.log('QZ Tray connected');
    } catch (err) {
        console.error('QZ Tray connection failed', err);
        throw err;
    }
};

export const getDefaultPrinter = async () => {
    await connectQz();
    return await qz.printers.getDefault();
};

export const printRaw = async (data: string, printerName?: string) => {
    try {
        await connectQz();
        const printer = printerName || (await qz.printers.getDefault());
        if (!printer) throw new Error('No printer found');
        const config = qz.configs.create(printer);
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
