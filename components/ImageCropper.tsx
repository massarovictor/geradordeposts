import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CheckIcon, XMarkIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

interface ImageCropperProps {
    imageUrl: string;
    onConfirm: (croppedImageUrl: string) => void;
    onCancel: () => void;
}

export function ImageCropper({ imageUrl, onConfirm, onCancel }: ImageCropperProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [scale, setScale] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageLoaded, setImageLoaded] = useState(false);
    const imageRef = useRef<HTMLImageElement | null>(null);

    const cropSize = 220; // Size of the crop circle in the UI

    // Load image
    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            imageRef.current = img;
            // Calculate initial scale to fit the smaller dimension
            const minDim = Math.min(img.width, img.height);
            const initialScale = (cropSize * 1.2) / minDim;
            setScale(initialScale);
            setImageLoaded(true);
        };
        img.src = imageUrl;
    }, [imageUrl]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }, [position]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y,
        });
    }, [isDragging, dragStart]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0];
        setIsDragging(true);
        setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }, [position]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        setPosition({
            x: touch.clientX - dragStart.x,
            y: touch.clientY - dragStart.y,
        });
    }, [isDragging, dragStart]);

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleZoom = useCallback((delta: number) => {
        setScale((prev) => Math.max(0.2, Math.min(4, prev + delta)));
    }, []);

    const handleConfirm = useCallback(() => {
        if (!imageRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = imageRef.current;
        const outputSize = 400;
        canvas.width = outputSize;
        canvas.height = outputSize;

        // Clear canvas
        ctx.clearRect(0, 0, outputSize, outputSize);

        // Create circular clip
        ctx.beginPath();
        ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Fill with white background
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Calculate where to draw the image
        const scaleFactor = outputSize / cropSize;
        const scaledWidth = img.width * scale * scaleFactor;
        const scaledHeight = img.height * scale * scaleFactor;

        const drawX = (outputSize / 2) + (position.x * scaleFactor) - (scaledWidth / 2);
        const drawY = (outputSize / 2) + (position.y * scaleFactor) - (scaledHeight / 2);

        ctx.drawImage(img, drawX, drawY, scaledWidth, scaledHeight);

        const croppedUrl = canvas.toDataURL('image/png', 1.0);
        onConfirm(croppedUrl);
    }, [position, scale, onConfirm, cropSize]);

    const img = imageRef.current;
    const displayWidth = img ? img.width * scale : 0;
    const displayHeight = img ? img.height * scale : 0;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Ajustar Enquadramento</h3>
                    <p className="text-xs text-gray-500">Arraste para posicionar</p>
                </div>

                {/* Crop Area */}
                <div className="p-6 bg-gray-900 flex items-center justify-center">
                    <div
                        className="relative overflow-hidden rounded-full cursor-move bg-gray-800"
                        style={{ width: cropSize, height: cropSize }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* Image - maintains aspect ratio */}
                        {imageLoaded && img && (
                            <img
                                src={imageUrl}
                                alt="Crop preview"
                                className="absolute pointer-events-none select-none"
                                style={{
                                    width: displayWidth,
                                    height: displayHeight,
                                    left: '50%',
                                    top: '50%',
                                    transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
                                }}
                                draggable={false}
                            />
                        )}

                        {/* Overlay guide */}
                        <div className="absolute inset-0 border-4 border-white/50 rounded-full pointer-events-none" />
                        {!imageLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                            </div>
                        )}
                        {imageLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                                <ArrowsPointingOutIcon className="w-10 h-10 text-white" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Zoom Controls */}
                <div className="px-6 py-3 bg-gray-50 flex items-center justify-center gap-4">
                    <button
                        onClick={() => handleZoom(-0.1)}
                        className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-xl font-bold shadow-sm"
                    >
                        −
                    </button>
                    <div className="flex items-center gap-2 min-w-[80px] justify-center">
                        <span className="text-xs text-gray-500">Zoom:</span>
                        <span className="text-sm font-semibold text-gray-700">{Math.round(scale * 100)}%</span>
                    </div>
                    <button
                        onClick={() => handleZoom(0.1)}
                        className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-xl font-bold shadow-sm"
                    >
                        +
                    </button>
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2.5 px-4 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                    >
                        <XMarkIcon className="w-4 h-4" />
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <CheckIcon className="w-4 h-4" />
                        Confirmar
                    </button>
                </div>

                {/* Hidden canvas for cropping */}
                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    );
}
