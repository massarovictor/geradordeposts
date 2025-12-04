import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import {
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  RectangleGroupIcon,
  TrashIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline';

// Types
import { Student, PageConfig, ThemeColor, CardLayout, LAYOUT_CONFIG, SCHOOL_YEARS, SCHOOL_COURSES } from './types';

// Hooks
import { useLocalStorage } from './hooks/useLocalStorage';
import { useStudents, ImportMode } from './hooks/useStudents';
import { useConfig, defaultConfig } from './hooks/useConfig';
import { useFilters } from './hooks/useFilters';

// Components
import { ClassGrid } from './components/ClassGrid';
import { FilterBar } from './components/FilterBar';
import { LayoutSelector } from './components/LayoutSelector';
import { StudentList } from './components/StudentList';
import { StudentForm } from './components/StudentForm';
import { PreviewControls } from './components/PreviewControls';

const STORAGE_KEY = 'student-cards-state-v2';

// Instagram post dimensions (4:5 aspect ratio)
const EXPORT_WIDTH = 1080;
const EXPORT_HEIGHT = 1350;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseGradeParts = (grade: string) => {
  const [year, ...rest] = grade.split(' ');
  const course = rest.join(' ').trim();
  return { year: SCHOOL_YEARS.includes(year) ? year : undefined, course: course || undefined };
};

interface AppState {
  students: Student[];
  config: PageConfig;
  currentPage: number;
}

export default function App() {
  // Persisted state
  const [savedState, setSavedState, hydrated] = useLocalStorage<AppState>(STORAGE_KEY, {
    students: [],
    config: defaultConfig,
    currentPage: 0,
  });

  // Students hook
  const {
    students,
    setStudents,
    addStudent,
    updateStudent,
    removeStudent,
    moveStudent,
    reorderStudents,
    downloadTemplate,
    importFromExcel,
    clearAll,
  } = useStudents(savedState.students);

  // Config hook
  const { config, setConfig, updateConfig, setLayout } = useConfig(savedState.config);

  // Filters hook
  const { filters, setYearFilter, setCourseFilter, clearFilters, filterStudents, hasActiveFilters } = useFilters();

  // Local state
  const [currentPage, setCurrentPage] = useState(savedState.currentPage);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedYear, setSelectedYear] = useState(SCHOOL_YEARS[0]);
  const [selectedCourse, setSelectedCourse] = useState(SCHOOL_COURSES[0]);
  const [newImage, setNewImage] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('append');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [previewScale, setPreviewScale] = useState(1);
  const [showMobileFrame, setShowMobileFrame] = useState(false);

  // Refs
  const cardRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Derived state
  const filteredStudents = useMemo(() => filterStudents(students), [filterStudents, students]);
  const studentsPerPage = LAYOUT_CONFIG[config.cardLayout || CardLayout.GRID_3X3].max;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredStudents.length / studentsPerPage)), [filteredStudents.length, studentsPerPage]);
  const currentStudents = useMemo(
    () => filteredStudents.slice(currentPage * studentsPerPage, (currentPage + 1) * studentsPerPage),
    [filteredStudents, currentPage, studentsPerPage]
  );

  // Persist state changes
  useEffect(() => {
    if (!hydrated) return;
    setSavedState({ students, config, currentPage });
  }, [students, config, currentPage, hydrated, setSavedState]);

  // Sync page with total pages
  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, Math.max(totalPages - 1, 0)));
  }, [totalPages]);

  // Handlers
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          updateConfig({ logoUrl: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          updateConfig({ backgroundImageUrl: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImportSheet = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importFromExcel(file, importMode);

    if (result.imported === 0) {
      alert('Nenhum aluno válido encontrado. Verifique o arquivo.');
    } else {
      alert(`${result.imported} aluno(s) importado(s) com sucesso.${result.errors.length ? `\n${result.errors.length} linha(s) ignoradas.` : ''}`);
    }

    if (importInputRef.current) importInputRef.current.value = '';
  };

  const handleAddOrUpdate = () => {
    if (!newName.trim()) return;

    if (editingId) {
      updateStudent(editingId, newName, selectedYear, selectedCourse, newImage);
      cancelEdit();
    } else {
      addStudent(newName, selectedYear, selectedCourse, newImage);
      setNewName('');
      setNewImage(null);
    }
  };

  const startEditing = (student: Student) => {
    setEditingId(student.id);
    setNewName(student.name);
    setNewImage(null);

    if (student.year && SCHOOL_YEARS.includes(student.year)) {
      setSelectedYear(student.year);
    } else {
      const parsed = parseGradeParts(student.grade);
      if (parsed.year && SCHOOL_YEARS.includes(parsed.year)) setSelectedYear(parsed.year);
    }

    if (student.course && SCHOOL_COURSES.includes(student.course)) {
      setSelectedCourse(student.course);
    } else {
      const parsed = parseGradeParts(student.grade);
      if (parsed.course && SCHOOL_COURSES.includes(parsed.course)) setSelectedCourse(parsed.course);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewName('');
    setNewImage(null);
  };

  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDragOver = (idx: number, e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) return;
    reorderStudents(dragIndex, idx);
    setDragIndex(idx);
  };
  const handleDragEnd = () => setDragIndex(null);

  const downloadPage = useCallback(
    async (pageIndex: number, keepPage = false, returnBlob = false): Promise<Blob | null> => {
      if (!cardRef.current) return null;
      const originalPage = currentPage;
      if (pageIndex !== currentPage) {
        setCurrentPage(pageIndex);
        await delay(200);
      }

      // Calculate pixel ratio to achieve 1080x1350 output
      // Card is 400px wide, so we need 1080/400 = 2.7 ratio
      const pixelRatio = EXPORT_WIDTH / 400;

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: pixelRatio,
        backgroundColor: '#fff',
        width: 400,
        height: 500, // 4:5 aspect ratio
      });

      if (returnBlob) {
        // Convert data URL to blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        if (!keepPage && pageIndex !== originalPage) {
          setCurrentPage(originalPage);
        }
        return blob;
      }

      const link = document.createElement('a');
      link.download = `card-pagina-${pageIndex + 1}.png`;
      link.href = dataUrl;
      link.click();

      if (!keepPage && pageIndex !== originalPage) {
        setCurrentPage(originalPage);
      }
      return null;
    },
    [currentPage]
  );

  const handleDownloadCurrent = useCallback(() => {
    downloadPage(currentPage).catch((err) => {
      console.error('Failed to download image', err);
      alert('Erro ao baixar a imagem. Tente novamente.');
    });
  }, [currentPage, downloadPage]);

  const handleDownloadAll = useCallback(async () => {
    if (isExportingAll) return;
    setIsExportingAll(true);
    const original = currentPage;

    try {
      const zip = new JSZip();
      const folder = zip.folder('cards-alunos-destaques');

      for (let i = 0; i < totalPages; i++) {
        const blob = await downloadPage(i, true, true);
        if (blob && folder) {
          folder.file(`card-pagina-${i + 1}.png`, blob);
        }
        await delay(100);
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'cards-alunos-destaques.zip';
      link.click();
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Failed to download all pages', err);
      alert('Erro ao baixar páginas. Tente novamente.');
    } finally {
      setCurrentPage(original);
      setIsExportingAll(false);
    }
  }, [currentPage, totalPages, downloadPage, isExportingAll]);

  const themes = [
    { id: ThemeColor.GREEN, label: 'Verde', color: 'bg-emerald-600' },
    { id: ThemeColor.BLUE, label: 'Azul', color: 'bg-blue-600' },
    { id: ThemeColor.RED, label: 'Vermelho', color: 'bg-red-600' },
    { id: ThemeColor.PURPLE, label: 'Roxo', color: 'bg-purple-600' },
    { id: ThemeColor.BLACK, label: 'Preto', color: 'bg-gray-900' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* LEFT PANEL: Controls */}
      <div className="w-full md:w-1/2 flex flex-col md:h-screen bg-white border-r border-gray-200 shadow-xl z-20">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 text-emerald-700 mb-1">
            <UsersIcon className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Gerador de Grade</h1>
          </div>
          <p className="text-xs text-gray-500">Visual Minimalista / Liquid Glass</p>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Layout Selector */}
          <LayoutSelector
            currentLayout={config.cardLayout || CardLayout.GRID_3X3}
            onLayoutChange={setLayout}
          />

          {/* Appearance Section */}
          <section className="space-y-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Aparência & Configuração</h3>

            <div className="grid grid-cols-1 gap-4">
              {/* Logos & Backgrounds Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* LOGO */}
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Brasão / Logo</label>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-md border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {config.logoUrl ? (
                        <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[9px] text-gray-400">Vazio</span>
                      )}
                    </div>
                    <label className="cursor-pointer flex-1">
                      <span className="block w-full text-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[10px] py-2 px-1 rounded-md shadow-sm transition-colors">
                        Carregar
                      </span>
                      <input type="file" className="hidden" accept="image/*" ref={logoInputRef} onChange={handleLogoUpload} />
                    </label>
                    {config.logoUrl && (
                      <button onClick={() => updateConfig({ logoUrl: null })} className="text-gray-400 hover:text-red-500">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* BACKGROUND IMAGE */}
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">Fundo (Textura)</label>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-md border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {config.backgroundImageUrl ? (
                        <img src={config.backgroundImageUrl} alt="BG" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] text-gray-400">Vazio</span>
                      )}
                    </div>
                    <label className="cursor-pointer flex-1">
                      <span className="block w-full text-center bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[10px] py-2 px-1 rounded-md shadow-sm transition-colors">
                        Carregar
                      </span>
                      <input type="file" className="hidden" accept="image/*" ref={bgInputRef} onChange={handleBackgroundUpload} />
                    </label>
                    {config.backgroundImageUrl && (
                      <button onClick={() => updateConfig({ backgroundImageUrl: null })} className="text-gray-400 hover:text-red-500">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700">Título cabeçalho</label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={config.schoolName}
                  onChange={(e) => updateConfig({ schoolName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-700">Título Rodapé</label>
                  <input
                    type="text"
                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={config.footerTitle}
                    onChange={(e) => updateConfig({ footerTitle: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Subtítulo</label>
                  <input
                    type="text"
                    className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={config.footerSubtitle}
                    onChange={(e) => updateConfig({ footerSubtitle: e.target.value })}
                  />
                </div>
              </div>

              {/* Visual Options */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1 cursor-pointer" title="Aplicar desfoque na imagem de fundo">
                    <input
                      type="checkbox"
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3 h-3"
                      checked={config.enableBackgroundBlur}
                      onChange={(e) => updateConfig({ enableBackgroundBlur: e.target.checked })}
                    />
                    <span className="text-[10px] text-gray-500">Desfocar</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer" title="Misturar cor do tema com a imagem">
                    <input
                      type="checkbox"
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3 h-3"
                      checked={config.enableThemeOverlay}
                      onChange={(e) => updateConfig({ enableThemeOverlay: e.target.checked })}
                    />
                    <span className="text-[10px] text-gray-500">Tingir</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer" title="Aplicar a cor do tema em textos/bordas/pills">
                    <input
                      type="checkbox"
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3 h-3"
                      checked={config.applyThemeToAccents}
                      onChange={(e) => updateConfig({ applyThemeToAccents: e.target.checked })}
                    />
                    <span className="text-[10px] text-gray-500">Detalhes</span>
                  </label>
                </div>

                {/* Theme Colors */}
                <div className="flex flex-wrap gap-2">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => updateConfig({ themeColor: t.id })}
                      className={`w-8 h-8 rounded-full ${t.color} ring-offset-2 transition-all shadow-sm ${config.themeColor === t.id ? 'ring-2 ring-gray-400 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'
                        }`}
                      title={t.label}
                    />
                  ))}

                  <label
                    className={`w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 ring-offset-2 transition-all shadow-sm flex items-center justify-center cursor-pointer ${config.themeColor === ThemeColor.CUSTOM ? 'ring-2 ring-gray-400 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                  >
                    <SwatchIcon className="w-4 h-4 text-white" />
                    <input
                      type="color"
                      className="opacity-0 w-0 h-0 absolute"
                      value={config.customThemeColor || '#000000'}
                      onChange={(e) =>
                        updateConfig({
                          themeColor: ThemeColor.CUSTOM,
                          customThemeColor: e.target.value,
                          customAccentColor: config.useSingleCustomColor ? e.target.value : config.customAccentColor,
                        })
                      }
                    />
                  </label>
                </div>

                {/* Color Pickers */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-gray-600">
                  <label className="flex items-center gap-2">
                    <span className="w-32">Cor do cabeçalho</span>
                    <input
                      type="color"
                      value={config.headerTitleColor || '#0f172a'}
                      onChange={(e) => updateConfig({ headerTitleColor: e.target.value })}
                      className="w-10 h-6 border rounded"
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="w-32">Cor do rodapé</span>
                    <input
                      type="color"
                      value={config.footerTitleColor || '#ffffff'}
                      onChange={(e) => updateConfig({ footerTitleColor: e.target.value })}
                      className="w-10 h-6 border rounded"
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="w-32">Cor do Subtítulo</span>
                    <input
                      type="color"
                      value={config.subtitleColor || '#0f172a'}
                      onChange={(e) => updateConfig({ subtitleColor: e.target.value })}
                      className="w-10 h-6 border rounded"
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="w-28">Cor do fundo</span>
                    <input
                      type="color"
                      value={config.customThemeColor || '#000000'}
                      onChange={(e) =>
                        updateConfig({
                          themeColor: ThemeColor.CUSTOM,
                          customThemeColor: e.target.value,
                          customAccentColor: config.useSingleCustomColor ? e.target.value : config.customAccentColor,
                        })
                      }
                      className="w-10 h-6 border rounded"
                      title="Cor usada para tingir o fundo quando o tema é personalizado"
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="w-32">Cor dos detalhes</span>
                    <input
                      type="color"
                      value={(config.useSingleCustomColor ? config.customThemeColor : config.customAccentColor) || '#000000'}
                      disabled={config.useSingleCustomColor}
                      onChange={(e) =>
                        updateConfig({
                          themeColor: ThemeColor.CUSTOM,
                          customAccentColor: e.target.value,
                        })
                      }
                      className="w-10 h-6 border rounded disabled:opacity-60"
                      title="Textos, bordas e pills quando o tema é personalizado"
                    />
                  </label>
                  <label className="flex items-center gap-2 sm:col-span-2">
                    <input
                      type="checkbox"
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3 h-3"
                      checked={config.useSingleCustomColor}
                      onChange={(e) =>
                        updateConfig({
                          useSingleCustomColor: e.target.checked,
                          customAccentColor: e.target.checked ? config.customThemeColor : config.customAccentColor,
                        })
                      }
                    />
                    <span className="text-[10px] text-gray-500">Usar uma única cor para tudo</span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Import Section */}
          <section className="space-y-3 p-4 rounded-xl border border-blue-100 bg-blue-50/50">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800 flex-1">Importação em Lote (Excel)</h3>
              <span className="text-[10px] text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-100">
                Modo: {importMode === 'append' ? 'Anexar' : 'Sobrescrever'}
              </span>
            </div>
            <p className="text-[10px] text-blue-700">Baixe o modelo, preencha e escolha se quer anexar ou substituir.</p>

            <div className="flex gap-2 mt-1">
              <button
                onClick={downloadTemplate}
                className="flex-1 flex items-center justify-center gap-1.5 bg-white border border-blue-200 text-blue-700 text-xs py-2 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                Baixar Modelo
              </button>

              <label className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white text-xs py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer shadow-sm">
                <DocumentArrowUpIcon className="w-4 h-4" />
                Importar
                <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={importInputRef} onChange={handleImportSheet} />
              </label>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-blue-800">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="import-mode"
                  className="text-blue-600"
                  checked={importMode === 'append'}
                  onChange={() => setImportMode('append')}
                />
                Anexar à lista
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name="import-mode"
                  className="text-blue-600"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                />
                Sobrescrever
              </label>
            </div>
          </section>

          {/* Student Form */}
          <StudentForm
            isEditing={!!editingId}
            name={newName}
            selectedYear={selectedYear}
            selectedCourse={selectedCourse}
            imagePreview={newImage}
            onNameChange={setNewName}
            onYearChange={setSelectedYear}
            onCourseChange={setSelectedCourse}
            onImageChange={setNewImage}
            onSubmit={handleAddOrUpdate}
            onCancel={cancelEdit}
            studentCount={students.length}
          />

          {/* Filters */}
          <FilterBar
            filters={filters}
            onYearChange={setYearFilter}
            onCourseChange={setCourseFilter}
            onClear={clearFilters}
            hasActiveFilters={hasActiveFilters}
            totalCount={students.length}
            filteredCount={filteredStudents.length}
          />

          {/* Student List */}
          <StudentList
            students={filteredStudents}
            editingId={editingId}
            onEdit={startEditing}
            onRemove={removeStudent}
            onMove={moveStudent}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            dragIndex={dragIndex}
            onClearAll={clearAll}
          />
        </div>
      </div>

      {/* RIGHT PANEL: Preview */}
      <div className="w-full md:w-1/2 bg-gray-100 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
        {/* Preview Controls */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
          <PreviewControls
            scale={previewScale}
            onScaleChange={setPreviewScale}
            showMobileFrame={showMobileFrame}
            onToggleMobileFrame={() => setShowMobileFrame(!showMobileFrame)}
          />
        </div>

        {/* Pagination Info */}
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 flex flex-wrap items-center gap-3 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm z-30">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-30"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
          </button>
          <span className="text-sm font-semibold text-gray-700">
            Página {currentPage + 1} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="p-1 hover:bg-gray-100 rounded-full disabled:opacity-30"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Download Buttons */}
        <div className="absolute bottom-6 z-30 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleDownloadCurrent}
            className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-3 rounded-full shadow-lg font-medium transition-transform transform hover:-translate-y-1"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Baixar Página Atual
          </button>
          <button
            onClick={handleDownloadAll}
            disabled={isExportingAll}
            className="flex items-center gap-2 bg-white text-gray-800 px-5 py-3 rounded-full shadow-lg font-medium border border-gray-200 hover:border-gray-300 hover:-translate-y-1 transition-transform disabled:opacity-60"
          >
            {isExportingAll ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <RectangleGroupIcon className="w-5 h-5" />}
            Baixar todas
          </button>
        </div>

        {/* The Card with Mobile Frame */}
        <div
          className={`transition-all duration-300 ${showMobileFrame ? 'p-4 bg-gray-900 rounded-[2.5rem] shadow-2xl' : ''}`}
          style={{ transform: `scale(${previewScale})` }}
        >
          {showMobileFrame && (
            <div className="w-full flex justify-center mb-2">
              <div className="w-20 h-1.5 bg-gray-700 rounded-full" />
            </div>
          )}
          <div className={`shadow-2xl ${showMobileFrame ? 'rounded-xl overflow-hidden' : ''}`}>
            <ClassGrid students={currentStudents} config={config} ref={cardRef} />
          </div>
          {showMobileFrame && (
            <div className="w-full flex justify-center mt-2">
              <div className="w-8 h-8 border-2 border-gray-700 rounded-full" />
            </div>
          )}
        </div>

        <p className="absolute bottom-2 text-[10px] text-gray-400">
          Mostrando {currentStudents.length} alunos (Máx {studentsPerPage} por Página) • Exporta: 1080×1350px
        </p>
      </div>
    </div>
  );
}
