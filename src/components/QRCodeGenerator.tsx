import React, { useEffect, useRef, useState } from 'react';
import { QrCode } from 'lucide-react';

interface QRCodeGeneratorProps {
    value: string;
    size?: number;
    fullscreenSize?: number;
    title?: string;
    enableFullscreen?: boolean;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ 
    value, 
    size = 200,
    fullscreenSize = 360,
    title,
    enableFullscreen = true
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fullscreenCanvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const generateQR = async () => {
            if (!value || !canvasRef.current) return;

            try {
                const QRCode = (await import('qrcode')).default;
                await QRCode.toCanvas(canvasRef.current, value, {
                    width: size,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    }
                });
                if (isFullscreen && fullscreenCanvasRef.current) {
                    await QRCode.toCanvas(fullscreenCanvasRef.current, value, {
                        width: fullscreenSize,
                        margin: 2,
                        color: {
                            dark: '#000000',
                            light: '#ffffff'
                        }
                    });
                }
                setError(null);
            } catch (err: any) {
                console.error('Error generating QR code:', err);
                setError('Gagal membuat QR Code');
            }
        };

        generateQR();
    }, [value, size, fullscreenSize, isFullscreen]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg">
                <QrCode className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center">
            <canvas ref={canvasRef} className="rounded-lg shadow-md" />
            {title && (
                <p className="mt-2 text-sm text-gray-600">{title}</p>
            )}
            {enableFullscreen && (
                <button
                    type="button"
                    onClick={() => setIsFullscreen(true)}
                    className="mt-3 text-sm text-green-700 hover:text-green-800"
                >
                    Full Screen
                </button>
            )}
            {isFullscreen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-6">
                    <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center">
                        <canvas ref={fullscreenCanvasRef} className="rounded-lg shadow-md" />
                        <button
                            type="button"
                            onClick={() => setIsFullscreen(false)}
                            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QRCodeGenerator;
