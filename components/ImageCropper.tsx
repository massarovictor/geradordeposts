import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CheckIcon, XMarkIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

interface ImageCropperProps {
    imageUrl: string;
    onConfirm: (croppedImageUrl: string) => void;
    onCancel: () => void;
}

export function ImageCropper({ imageUrl, onConfirm, onCancel }: ImageCropperProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [userZoom, setUserZoom] = useState(1); // User-controlled zoom: 1x = fit, up to 3x
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
    const [baseScale, setBaseScale] = useState(1); // Scale to fit image in crop area
    const imageRef = useRef<HTMLImageElement | null>(null);

    const cropSize = 220;

    // Load image and calculate base scale
    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            imageRef.current = img;
            setImageDimensions({ width: img.width, height: img.height });

            // Calculate base scale so the smaller dimension fills the crop area
            const minDim = Math.min(img.width, img.height);
            const calculatedBaseScale = cropSize / minDim;
            setBaseScale(calculatedBaseScale);
            setUserZoom(1);
            setPosition({ x: 0, y: 0 });
            setImageLoaded(true);
        };
        img.src = imageUrl;
    }, [imageUrl]);

    // Total scale = baseScale * userZoom
    const totalScale = baseScale * userZoom;

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

    const handleZoomChange = useCallback((newZoom: number) => {
        setUserZoom(Math.max(0.5, Math.min(3, newZoom)));
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
        ctx.fillRect(0, 0, outputSize, outputSize);

        // Scale factor from preview crop area to output canvas
        const scaleFactor = outputSize / cropSize;

        // Calculate the final scaled dimensions using totalScale
        const scaledWidth = img.width * totalScale * scaleFactor;
        const scaledHeight = img.height * totalScale * scaleFactor;

        // Position needs to account for the scale and be relative to center
        const drawX = (outputSize / 2) - (scaledWidth / 2) + (position.x * scaleFactor);
        const drawY = (outputSize / 2) - (scaledHeight / 2) + (position.y * scaleFactor);

        ctx.drawImage(img, drawX, drawY, scaledWidth, scaledHeight);

        const croppedUrl = canvas.toDataURL('image/png', 1.0);
        onConfirm(croppedUrl);
    }, [position, totalScale, onConfirm, cropSize]);

    // Calculate display dimensions
    const displayWidth = imageDimensions.width * totalScale;
    const displayHeight = imageDimensions.height * totalScale;

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Ajustar Enquadramento</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Arraste para posicionar e use o zoom para ajustar</p>
                </div>

                {/* Crop Area */}
                <div className="p-6 bg-gray-900 flex items-center justify-center">
                    <div
                        ref={containerRef}
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
                        {/* Image preview */}
                        {imageLoaded && (
                            <img
                                src={imageUrl}
                                alt="Crop preview"
                                className="absolute pointer-events-none select-none"
                                draggable={false}
                                style={{
                                    width: displayWidth,
                                    height: displayHeight,
                                    left: `calc(50% + ${position.x}px)`,
                                    top: `calc(50% + ${position.y}px)`,
                                    transform: 'translate(-50%, -50%)',
                                }}
                            />
                        )}

                        {/* Border guide */}
                        <div className="absolute inset-0 border-4 border-white/30 rounded-full pointer-events-none" />

                        {/* Loading spinner */}
                        {!imageLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Zoom Controls */}
                <div className="px-6 py-4 bg-gray-50 flex items-center justify-center gap-4">
                    <button
                        onClick={() => handleZoomChange(userZoom - 0.25)}
                        disabled={userZoom <= 0.5}
                        className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm transition-colors"
                    >
                        <MinusIcon className="w-5 h-5" />
                    </button>

                    <div className="flex-1 max-w-[150px]">
                        <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.1"
                            value={userZoom}
                            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                        <div className="text-center text-xs text-gray-500 mt-1 font-medium">
                            {Math.round(userZoom * 100)}%
                        </div>
                    </div>

                    <button
                        onClick={() => handleZoomChange(userZoom + 0.25)}
                        disabled={userZoom >= 3}
                        className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
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
