import React, { useEffect, useRef, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface QRScannerProps {
    onScan: (result: string) => void;
    onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
    const [error, setError] = useState<string | null>(null);
    const [manualCode, setManualCode] = useState('');
    const scannerRef = useRef<any>(null);

    useEffect(() => {
        startScanner();

        return () => {
            stopScanner();
        };
    }, []);

    const startScanner = async () => {
        try {
            setError(null);
            const { Html5Qrcode } = await import('html5-qrcode');

            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText: string) => {
                    onScan(decodedText);
                    stopScanner();
                },
                () => {}
            );
        } catch (err: any) {
            console.error('Error starting scanner:', err);
            setError('Tidak dapat mengakses kamera. Pastikan kamera diizinkan.');
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (err: any) {
                console.error('Error stopping scanner:', err);
            }
        }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualCode.trim()) {
            onScan(manualCode.trim().toUpperCase());
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold">Scan QR Code</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X className="h-6 w-6 text-gray-500" />
                    </button>
                </div>

                <div className="p-4">
                    <div 
                        id="qr-reader" 
                        className="w-full bg-gray-900 rounded-lg overflow-hidden"
                        style={{ minHeight: '300px' }}
                    ></div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <div className="mt-4">
                        <p className="text-center text-sm text-gray-600 mb-2">atau masukkan kode manual:</p>
                        <form onSubmit={handleManualSubmit} className="flex gap-2">
                            <input
                                type="text"
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                placeholder="Masukkan kode (例: ABC123)"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Submit
                            </button>
                        </form>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                            <strong>Tips:</strong> Arahkan kamera ke QR Code yang ditampilkan di halaman kegiatan.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRScanner;
