import axios from 'axios';
import { useState } from 'react';

export const OTP_MAX_LENGTH = 6;

export function useTwoFactorAuth() {
    const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
    const [manualSetupKey, setManualSetupKey] = useState<string | null>(null);
    const [recoveryCodesList, setRecoveryCodesList] = useState<string[]>([]);
    const [errors, setErrors] = useState<string[]>([]);

    const fetchSetupData = async () => {
        try {
            const [qrResponse, secretResponse] = await Promise.all([
                axios.get('/user/two-factor-qr-code'),
                axios.get('/user/two-factor-secret-key'),
            ]);

            setQrCodeSvg(qrResponse.data.svg);
            setManualSetupKey(secretResponse.data.secretKey);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            setErrors([
                error.response?.data?.message || 'Failed to fetch setup data.',
            ]);
        }
    };

    const fetchRecoveryCodes = async () => {
        try {
            const response = await axios.get('/user/two-factor-recovery-codes');
            setRecoveryCodesList(response.data);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            setErrors([
                error.response?.data?.message ||
                    'Failed to fetch recovery codes.',
            ]);
        }
    };

    const clearSetupData = () => {
        setQrCodeSvg(null);
        setManualSetupKey(null);
        setErrors([]);
    };

    const hasSetupData = !!qrCodeSvg && !!manualSetupKey;

    return {
        qrCodeSvg,
        hasSetupData,
        manualSetupKey,
        clearSetupData,
        fetchSetupData,
        recoveryCodesList,
        fetchRecoveryCodes,
        errors,
    };
}
