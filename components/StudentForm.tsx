import React, { useRef, useState } from 'react';
import { SCHOOL_YEARS, SCHOOL_COURSES } from '../types';
import { UserPlusIcon, PhotoIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';
import { ImageCropper } from './ImageCropper';

interface StudentFormProps {
    isEditing: boolean;
    name: string;
    selectedYear: string;
    selectedCourse: string;
    imagePreview: string | null;
    onNameChange: (name: string) => void;
    onYearChange: (year: string) => void;
    onCourseChange: (course: string) => void;
    onImageChange: (imageUrl: string | null) => void;
    onSubmit: () => void;
    onCancel: () => void;
    studentCount: number;
}

export function StudentForm({
    isEditing,
    name,
    selectedYear,
    selectedCourse,
    imagePreview,
    onNameChange,
    onYearChange,
    onCourseChange,
    onImageChange,
    onSubmit,
    onCancel,
    studentCount,
}: StudentFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropperImage, setCropperImage] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    // Open cropper instead of directly setting the image
                    setCropperImage(event.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropConfirm = (croppedImage: string) => {
        onImageChange(croppedImage);
        setCropperImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCropCancel = () => {
        setCropperImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = () => {
        onSubmit();
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCancel = () => {
        onCancel();
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <>
            {/* Image Cropper Modal */}
            {cropperImage && (
                <ImageCropper
                    imageUrl={cropperImage}
                    onConfirm={handleCropConfirm}
                    onCancel={handleCropCancel}
                />
            )}

            <section
                className={`space-y-4 p-4 rounded-xl border transition-colors ${isEditing ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50/50 border-emerald-100'
                    }`}
            >
                <div className="flex justify-between items-center">
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isEditing ? 'text-amber-800' : 'text-emerald-800'}`}>
                        {isEditing ? 'Editando Aluno' : 'Adicionar Manualmente'}
                    </h3>
                    {isEditing ? (
                        <button onClick={handleCancel} className="text-xs text-amber-700 underline">
                            Cancelar
                        </button>
                    ) : (
                        <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                            {studentCount} adicionados
                        </span>
                    )}
                </div>

                <div className="flex gap-3 items-start">
                    <label className="relative w-20 h-20 flex-shrink-0 cursor-pointer group">
                        <div
                            className={`w-full h-full rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-white transition-colors ${imagePreview ? 'border-emerald-500' : 'border-gray-300 group-hover:border-emerald-400'
                                }`}
                        >
                            {imagePreview ? (
                                <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                            ) : (
                                <div className="text-center">
                                    <PhotoIcon className="w-6 h-6 text-gray-300 mx-auto" />
                                    <span className="text-[9px] text-gray-400 block mt-1">{isEditing ? 'Trocar' : 'Foto'}</span>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                        />
                        <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-100">
                            <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${isEditing ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                            >
                                {isEditing ? <PencilIcon className="w-3 h-3" /> : '+'}
                            </div>
                        </div>
                    </label>

                    <div className="flex-grow space-y-2">
                        <input
                            type="text"
                            placeholder="Nome do Aluno"
                            className="block w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                            value={name}
                            onChange={(e) => onNameChange(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        />

                        <div className="flex gap-2">
                            <select
                                className="block w-1/3 px-2 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                                value={selectedYear}
                                onChange={(e) => onYearChange(e.target.value)}
                            >
                                {SCHOOL_YEARS.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>

                            <select
                                className="block w-2/3 px-2 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                                value={selectedCourse}
                                onChange={(e) => onCourseChange(e.target.value)}
                            >
                                {SCHOOL_COURSES.map((course) => (
                                    <option key={course} value={course}>
                                        {course}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!name}
                    className={`w-full py-2 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${isEditing ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                >
                    {isEditing ? (
                        <>
                            <CheckIcon className="w-4 h-4" />
                            Salvar Alterações
                        </>
                    ) : (
                        <>
                            <UserPlusIcon className="w-4 h-4" />
                            Adicionar à Lista
                        </>
                    )}
                </button>
            </section>
        </>
    );
}
