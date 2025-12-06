
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { ArrowDownTrayIcon, PlusIcon, TrashIcon, PencilSquareIcon, ChevronLeftIcon, ChevronRightIcon, UsersIcon, DocumentArrowDownIcon, ArrowLeftIcon, SwatchIcon, DocumentArrowUpIcon, ArrowPathIcon, RectangleGroupIcon, UserGroupIcon, ArrowRightCircleIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';

// Types
import { PageConfig, Student, ThemeColor, CardLayout, LAYOUT_CONFIG, SCHOOL_YEARS, SCHOOL_COURSES } from './types';

// Hooks
import { useStudents, ImportMode } from './hooks/useStudents';
import { useConfig, defaultConfig } from './hooks/useConfig';
import { useFilters } from './hooks/useFilters';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useAuth } from './hooks/useAuth';
import { useProjectSync } from './hooks/useProjectSync';
import { useMasterStudents } from './hooks/useMasterStudents';
import { uploadImageToStorage, dataUrlToBlob, deleteImageFromStorage } from './services/storageService';

// Components
import { ClassGrid } from './components/ClassGrid';
import { FilterBar } from './components/FilterBar';
import { LayoutSelector } from './components/LayoutSelector';
import { StudentList } from './components/StudentList';
import { StudentForm } from './components/StudentForm';
import { TabNavigation, TabType } from './components/TabNavigation';
import { PreviewControls } from './components/PreviewControls';

import { MasterStudentSelector } from './components/MasterStudentSelector';
import { MasterBankPage } from './components/MasterBankPage';
import { Dashboard } from './components/Dashboard';

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

  // Auth (Supabase)
  const { user, loading: authLoading, error: authError, signIn, signUp, signOut, enabled: authEnabled } = useAuth();

  // Supabase sync hook (opcional, depende de env)
  const {
    projects,
    isLoadingProjects,
    loadProjects,
    currentProjectId,
    currentProjectName,
    selectProject,
    createNewProject,
    removeProject,
    renameCurrentProject,
    isLoadingRemote,
    loadRemote,
    saveRemote,
    supabaseEnabled,
  } = useProjectSync(user?.id);

  // Local state
  const [activeView, setActiveView] = useState<'dashboard' | 'master-bank' | 'editor'>('dashboard');
  const [activeTab, setActiveTab] = useState<TabType>('visual');
  const [currentPage, setCurrentPage] = useState(savedState.currentPage);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [selectedYear, setSelectedYear] = useState(SCHOOL_YEARS[0]);
  const [selectedCourse, setSelectedCourse] = useState(SCHOOL_COURSES[0]);
  const [newImage, setNewImage] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('append');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.85);
  const [showMobileFrame, setShowMobileFrame] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showMasterSelector, setShowMasterSelector] = useState(false);

  // Força navegação para dashboard se não há projeto selecionado
  useEffect(() => {
    if (!currentProjectId && activeView === 'editor') {
      setActiveView('dashboard');
    }
  }, [currentProjectId, activeView]);

  const showLogin = supabaseEnabled && authEnabled && !user;

  // Master students hook
  const {
    allStudents: allMasterStudents,
    students: masterStudents,
    loading: masterLoading,
    error: masterError,
    filters: masterFilters,
    setFilters: setMasterFilters,
    selectedIds: masterSelectedIds,
    toggleSelected: toggleMasterSelected,
    clearSelection: clearMasterSelection,
    createOrUpdate: createOrUpdateMaster,
    remove: removeMaster,
    editing: masterEditing,
    setEditing: setMasterEditing,
    selectedStudents: selectedMasterStudents,
    toProjectStudents,
    canUse: masterCanUse,
    reload: reloadMaster,
  } = useMasterStudents(
    user?.id || null,
    supabaseEnabled,
    (updatedStudent) => {
      // Callback: Update local project students if the master student was edited
      setStudents((prev) => prev.map((s) => {
        if (s.id === updatedStudent.id) {
          return {
            ...s,
            name: updatedStudent.name,
            imageUrl: updatedStudent.imageUrl,
          };
        }
        return s;
      }));

      // Also reload from DB to ensure full consistency (e.g. grade/year updates)
      if (currentProjectId) {
        // Create a small delay to ensure DB triggers are done if any
        setTimeout(() => {
          loadRemote().then(data => {
            if (data) setStudents(data.students);
          });
        }, 500);
      }
    }
  );

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

  // Load remoto do Supabase (uma vez quando projeto é selecionado)
  useEffect(() => {
    if (!supabaseEnabled || !currentProjectId || !user) return;
    loadRemote().then((data) => {
      if (!data) return;
      setStudents(data.students);
      setConfig(data.config);
      setCurrentPage(data.currentPage ?? 0);
    });
  }, [supabaseEnabled, currentProjectId, user, loadRemote, setStudents, setConfig]);

  // Persist state changes
  useEffect(() => {
    if (!hydrated) return;
    setSavedState({ students, config, currentPage });
  }, [students, config, currentPage, hydrated, setSavedState]);

  // Sync remoto (debounced) no Supabase
  useEffect(() => {
    if (!supabaseEnabled || !currentProjectId || isLoadingRemote || !user) return;
    saveRemote({ config, currentPage, students });
  }, [supabaseEnabled, currentProjectId, isLoadingRemote, user, config, currentPage, students, saveRemote]);

  // Sync page with total pages
  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, Math.max(totalPages - 1, 0)));
  }, [totalPages]);

  // Handlers
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (supabaseEnabled && user) {
        const url = await uploadImageToStorage(file, 'logos');
        if (url) updateConfig({ logoUrl: url });
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) updateConfig({ logoUrl: event.target.result as string });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (supabaseEnabled && user) {
        const url = await uploadImageToStorage(file, 'backgrounds');
        if (url) updateConfig({ backgroundImageUrl: url });
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) updateConfig({ backgroundImageUrl: event.target.result as string });
        };
        reader.readAsDataURL(file);
      }
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

  const handleAddOrUpdate = async () => {
    if (!newName.trim()) return;

    let finalImage: string | null = newImage;
    if (supabaseEnabled && user && newImage) {
      const blob = dataUrlToBlob(newImage);
      if (blob) {
        const uploaded = await uploadImageToStorage(blob, 'students');
        if (uploaded) finalImage = uploaded;
      }
    }

    if (editingId) {
      updateStudent(editingId, newName, selectedYear, selectedCourse, finalImage);
      cancelEdit();
    } else {
      addStudent(newName, selectedYear, selectedCourse, finalImage);
      setNewName('');
      setNewImage(null);
    }
  };

  const startEditing = (student: Student) => {
    setEditingId(student.id);
    setNewName(student.name);
    setNewImage(student.imageUrl || null);

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

  // Importar do seletor visual
  const handleImportFromSelector = (selected: any[]) => {
    const makeId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const newStudents: Student[] = selected.map(s => ({
      id: makeId(),
      name: s.name,
      grade: [s.year, s.course].filter(Boolean).join(' '),
      year: s.year,
      course: s.course,
      imageUrl: s.imageUrl || undefined,
    }));

    if (importMode === 'replace') {
      if (confirm(`Substituir lista atual por ${newStudents.length} alunos do banco?`)) {
        setStudents(newStudents);
      }
    } else {
      setStudents(prev => [...prev, ...newStudents]);
    }
    setShowMasterSelector(false);
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

      // Wait a bit to ensure everything is rendered
      await delay(300);

      // Generate font embed CSS with Base64 to strictly enforce Neulis font in export
      const origin = window.location.origin;
      const fontFiles = [
        { name: 'Neulis', weight: 400, url: `${origin}/font/NeulisAlt-Regular.otf` },
        { name: 'Neulis', weight: 500, url: `${origin}/font/NeulisAlt-Medium.otf` },
        { name: 'Neulis', weight: 600, url: `${origin}/font/NeulisAlt-SemiBold.otf` },
        { name: 'Neulis', weight: 700, url: `${origin}/font/NeulisAlt-Bold.otf` },
        { name: 'Neulis', weight: 800, url: `${origin}/font/NeulisAlt-ExtraBold.otf` },
        { name: 'Neulis', weight: 900, url: `${origin}/font/NeulisAlt-Black.otf` },
      ];

      let fontEmbedCSS = '';

      try {
        const fontPromises = fontFiles.map(async (font) => {
          try {
            const response = await fetch(font.url);
            const blob = await response.blob();
            return new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64 = reader.result as string;
                resolve(`@font-face { font-family: '${font.name}'; src: url('${base64}') format('opentype'); font-weight: ${font.weight}; }`);
              };
              reader.onerror = () => resolve(''); // Skip on error
              reader.readAsDataURL(blob);
            });
          } catch (e) {
            console.error('Error loading font for export:', font.url, e);
            return '';
          }
        });

        const fontFaces = await Promise.all(fontPromises);
        fontEmbedCSS = fontFaces.join('\n');
      } catch (error) {
        console.error('Error preparing fonts for export:', error);
      }

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: pixelRatio,
        width: 400,
        height: 500, // 4:5 aspect ratio
        fontEmbedCSS: fontEmbedCSS,
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

  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <UsersIcon className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Card */}
          <div className="bg-white/80 backdrop-blur-sm shadow-xl border border-gray-100 rounded-3xl p-8 space-y-6">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Acesso Restrito
              </span>
              <h1 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h1>
              <p className="text-sm text-gray-500 mt-1">Entre para acessar o gerador de cards</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all"
                  placeholder="seu@email.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Senha</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
              </div>

              {authError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <span className="text-red-500 text-xs">⚠️ {authError}</span>
                </div>
              )}

              <button
                onClick={() => signIn(authEmail, authPassword)}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-200 hover:shadow-emerald-300 disabled:opacity-50"
                disabled={authLoading}
              >
                {authLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Entrando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </button>
            </div>

            <p className="text-center text-xs text-gray-400">
              🔒 Apenas login disponível • Cadastro desativado
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Gerador de Grade © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    );
  }

  // Master Bank Page - página dedicada (Prioridade sobre Dashboard para funcionar sem projeto selecionado)
  if (supabaseEnabled && user && activeView === 'master-bank') {
    return (
      <MasterBankPage
        allStudents={allMasterStudents}
        students={masterStudents}
        loading={masterLoading}
        error={masterError}
        filters={masterFilters}
        setFilters={setMasterFilters}
        selectedIds={masterSelectedIds}
        toggleSelected={toggleMasterSelected}
        clearSelection={clearMasterSelection}
        createOrUpdate={createOrUpdateMaster}
        remove={removeMaster}
        editing={masterEditing}
        setEditing={setMasterEditing}
        sendSelected={() => {
          const incoming = toProjectStudents();
          setStudents((prev) => {
            const existingIds = new Set(prev.map((s) => s.id));
            const merged = [...prev];
            incoming.forEach((s) => {
              if (!existingIds.has(s.id)) merged.push(s);
            });
            return merged;
          });
          setActiveView('editor');
        }}
        canUse={masterCanUse}
        onBackToDashboard={() => setActiveView('dashboard')}
      />
    );
  }

  // Dashboard - sempre mostrar se não há projeto selecionado OU se explicitamente no dashboard
  if (supabaseEnabled && user && (!currentProjectId || activeView === 'dashboard')) {
    return (
      <Dashboard
        userEmail={user.email}
        masterCount={allMasterStudents ? allMasterStudents.length : null}
        onReloadMaster={reloadMaster}
        loadingMaster={masterLoading}
        supabaseConfigured={supabaseEnabled}
        onSignOut={signOut}
        authError={authError}
        projects={projects}
        currentProjectId={currentProjectId}
        currentProjectName={currentProjectName}
        loadingProjects={isLoadingProjects}
        onSelectProject={(id) => {
          selectProject(id);
          setActiveView('editor');
        }}
        onCreateProject={async (name) => { await createNewProject(name); }}
        onDeleteProject={async (id) => { await removeProject(id); }}
        onRenameProject={async (id, newName) => { await renameCurrentProject(newName); }}
        onEnterProject={() => setActiveView('editor')}
        masterStudents={masterStudents}
        onAccessMasterBank={() => setActiveView('master-bank')}
      />
    );
  }



  // Loading State for Project Data - PREVENTS WHITE SCREEN
  if (isLoadingRemote && activeView === 'editor') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-700">Carregando projeto...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* LEFT PANEL: Controls */}
      <div className="w-full md:w-1/2 flex flex-col md:h-screen bg-white border-r border-gray-200 shadow-xl z-20">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2 text-emerald-700 mb-1">
            <UsersIcon className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              {currentProjectName || 'Gerador de Grade'}
            </h1>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => {
                  selectProject(null);
                  setActiveView('dashboard');
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-3 h-3" />
                Dashboard
              </button>
              {supabaseEnabled && user && (
                <button
                  onClick={() => signOut()}
                  className="text-[11px] text-gray-500 hover:text-red-500 underline"
                >
                  Sair
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500">Visual Minimalista / Liquid Glass</p>
        </div>

        {/* Tab Navigation - Somente para Editor */}
        <div className="border-b border-gray-100 bg-white">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">

          {/* TAB: VISUAL & ESCOLA */}
          {activeTab === 'visual' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Layout Selector */}
              <LayoutSelector
                currentLayout={config.cardLayout || CardLayout.GRID_3X3}
                onLayoutChange={setLayout}
              />

              {/* Appearance Section */}
              <section className="space-y-5 p-5 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <SwatchIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Aparência & Configuração</h3>
                    <p className="text-xs text-gray-500">Personalize logos, cores e texturas</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  {/* Logos & Backgrounds Row */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* LOGO */}
                    <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <label className="text-xs font-semibold text-gray-700 block mb-3 flex items-center gap-2">
                        <PhotoIcon className="w-4 h-4 text-purple-500" />
                        Brasão / Logo
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {config.logoUrl ? (
                            <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                          ) : (
                            <PhotoIcon className="w-6 h-6 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <label className="cursor-pointer block">
                            <span className="block w-full text-center bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs py-2 px-3 rounded-lg font-medium transition-colors">
                              Escolher arquivo
                            </span>
                            <input type="file" className="hidden" accept="image/*" ref={logoInputRef} onChange={handleLogoUpload} />
                          </label>
                          {config.logoUrl && (
                            <button
                              onClick={async () => {
                                if (config.logoUrl) await deleteImageFromStorage(config.logoUrl);
                                updateConfig({ logoUrl: null });
                              }}
                              className="w-full text-xs text-gray-400 hover:text-red-500 py-1 transition-colors"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* BACKGROUND IMAGE */}
                    <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <label className="text-xs font-semibold text-gray-700 block mb-3 flex items-center gap-2">
                        <PhotoIcon className="w-4 h-4 text-blue-500" />
                        Fundo (Textura)
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {config.backgroundImageUrl ? (
                            <img src={config.backgroundImageUrl} alt="BG" className="w-full h-full object-cover" />
                          ) : (
                            <PhotoIcon className="w-6 h-6 text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <label className="cursor-pointer block">
                            <span className="block w-full text-center bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs py-2 px-3 rounded-lg font-medium transition-colors">
                              Escolher arquivo
                            </span>
                            <input type="file" className="hidden" accept="image/*" ref={bgInputRef} onChange={handleBackgroundUpload} />
                          </label>
                          {config.backgroundImageUrl && (
                            <button
                              onClick={async () => {
                                if (config.backgroundImageUrl) await deleteImageFromStorage(config.backgroundImageUrl);
                                updateConfig({ backgroundImageUrl: null });
                              }}
                              className="w-full text-xs text-gray-400 hover:text-red-500 py-1 transition-colors"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Text Inputs Section */}
                  <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-2 block">Título do Cabeçalho</label>
                        <input
                          type="text"
                          className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
                          value={config.schoolName}
                          onChange={(e) => updateConfig({ schoolName: e.target.value })}
                          placeholder="Ex: Colégio Estadual..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-2 block">Título Rodapé</label>
                          <input
                            type="text"
                            className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
                            value={config.footerTitle}
                            onChange={(e) => updateConfig({ footerTitle: e.target.value })}
                            placeholder="Destaques..."
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-2 block">Subtítulo</label>
                          <input
                            type="text"
                            className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
                            value={config.footerSubtitle}
                            onChange={(e) => updateConfig({ footerSubtitle: e.target.value })}
                            placeholder="Bimestre..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visual Options */}
                  <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm space-y-4">
                    <h4 className="text-xs font-semibold text-gray-700">Efeitos Visuais</h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${config.enableBackgroundBlur ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`} title="Aplicar desfoque na imagem de fundo">
                        <input
                          type="checkbox"
                          className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                          checked={config.enableBackgroundBlur}
                          onChange={(e) => updateConfig({ enableBackgroundBlur: e.target.checked })}
                        />
                        <span className="text-xs font-medium">Desfocar</span>
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${config.enableThemeOverlay ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`} title="Misturar cor do tema com a imagem">
                        <input
                          type="checkbox"
                          className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                          checked={config.enableThemeOverlay}
                          onChange={(e) => updateConfig({ enableThemeOverlay: e.target.checked })}
                        />
                        <span className="text-xs font-medium">Tingir</span>
                      </label>
                      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${config.applyThemeToAccents ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`} title="Aplicar a cor do tema em textos/bordas/pills">
                        <input
                          type="checkbox"
                          className="rounded text-purple-600 focus:ring-purple-500 w-3.5 h-3.5"
                          checked={config.applyThemeToAccents}
                          onChange={(e) => updateConfig({ applyThemeToAccents: e.target.checked })}
                        />
                        <span className="text-xs font-medium">Detalhes</span>
                      </label>
                    </div>

                    {/* Theme Colors */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-gray-700">Paleta de Cores</h4>
                      <div className="flex flex-wrap gap-2">
                        {themes.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => updateConfig({ themeColor: t.id })}
                            className={`w-9 h-9 rounded-xl ${t.color} transition-all shadow-sm hover:scale-110 ${config.themeColor === t.id ? 'ring-2 ring-offset-2 ring-purple-400 scale-110' : 'opacity-80 hover:opacity-100'}`}
                            title={t.label}
                          />
                        ))}
                        <label
                          className={`w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 transition-all shadow-sm flex items-center justify-center cursor-pointer hover:scale-110 ${config.themeColor === ThemeColor.CUSTOM ? 'ring-2 ring-offset-2 ring-purple-400 scale-110' : 'opacity-80 hover:opacity-100'}`}
                          title="Cor personalizada"
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
                    </div>

                    {/* Color Pickers Grid */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-gray-700">Cores Personalizadas</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors cursor-pointer">
                          <input
                            type="color"
                            value={config.headerTitleColor || '#0f172a'}
                            onChange={(e) => updateConfig({ headerTitleColor: e.target.value })}
                            className="w-6 h-6 rounded-md border-0 cursor-pointer"
                          />
                          <span className="text-xs text-gray-600">Cabeçalho</span>
                        </label>
                        <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors cursor-pointer">
                          <input
                            type="color"
                            value={config.footerTitleColor || '#ffffff'}
                            onChange={(e) => updateConfig({ footerTitleColor: e.target.value })}
                            className="w-6 h-6 rounded-md border-0 cursor-pointer"
                          />
                          <span className="text-xs text-gray-600">Rodapé</span>
                        </label>
                        <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors cursor-pointer">
                          <input
                            type="color"
                            value={config.subtitleColor || '#0f172a'}
                            onChange={(e) => updateConfig({ subtitleColor: e.target.value })}
                            className="w-6 h-6 rounded-md border-0 cursor-pointer"
                          />
                          <span className="text-xs text-gray-600">Subtítulo</span>
                        </label>
                        <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors cursor-pointer">
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
                            className="w-6 h-6 rounded-md border-0 cursor-pointer"
                          />
                          <span className="text-xs text-gray-600">Fundo</span>
                        </label>
                        <label className={`flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors cursor-pointer ${config.useSingleCustomColor ? 'opacity-50' : ''}`}>
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
                            className="w-6 h-6 rounded-md border-0 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className="text-xs text-gray-600">Detalhes</span>
                        </label>
                        <label className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors cursor-pointer ${config.useSingleCustomColor ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-gray-50 border-gray-100 hover:border-purple-200'}`}>
                          <input
                            type="checkbox"
                            className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                            checked={config.useSingleCustomColor}
                            onChange={(e) =>
                              updateConfig({
                                useSingleCustomColor: e.target.checked,
                                customAccentColor: e.target.checked ? config.customThemeColor : config.customAccentColor,
                              })
                            }
                          />
                          <span className="text-xs font-medium">Cor única</span>
                        </label>
                      </div>
                    </div>

                    {/* Card Theme Toggle */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-gray-700">Tema do Card de Alunos</h4>
                      <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-gray-100 p-1">
                        <button
                          onClick={() => updateConfig({ darkCardMode: false })}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${!config.darkCardMode
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                          <span>☀️</span>
                          <span>Claro</span>
                        </button>
                        <button
                          onClick={() => updateConfig({ darkCardMode: true })}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg transition-all ${config.darkCardMode
                            ? 'bg-gray-800 text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                          <span>🌙</span>
                          <span>Escuro</span>
                        </button>
                      </div>
                    </div>

                    {/* Grid Background Customization */}
                    <div className="space-y-3 pt-3 border-t border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-700">Fundo da Área de Cards</h4>

                      {/* Color and Opacity */}
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100 hover:border-purple-200 transition-colors cursor-pointer">
                          <input
                            type="color"
                            value={config.gridBackgroundColor || '#ffffff'}
                            onChange={(e) => updateConfig({ gridBackgroundColor: e.target.value })}
                            className="w-6 h-6 rounded-md border-0 cursor-pointer"
                          />
                          <span className="text-xs text-gray-600">Cor</span>
                        </label>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={config.gridBackgroundOpacity ?? 50}
                              onChange={(e) => updateConfig({ gridBackgroundOpacity: parseInt(e.target.value) })}
                              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                            <span className="text-xs text-gray-500 w-10 text-right">{config.gridBackgroundOpacity ?? 50}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Pattern Selector */}
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { id: 'none', label: 'Nenhum', icon: '⬜' },
                          { id: 'dots', label: 'Pontos', icon: '⬤' },
                          { id: 'grid', label: 'Grade', icon: '▦' },
                          { id: 'diagonal', label: 'Diagonal', icon: '◫' },
                          { id: 'radial', label: 'Radial', icon: '◎' },
                        ].map((pattern) => (
                          <button
                            key={pattern.id}
                            onClick={() => updateConfig({ gridBackgroundPattern: pattern.id as 'none' | 'dots' | 'grid' | 'diagonal' | 'radial' })}
                            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border transition-all ${config.gridBackgroundPattern === pattern.id || (!config.gridBackgroundPattern && pattern.id === 'none')
                              ? 'bg-purple-100 border-purple-300 text-purple-700'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-purple-200'
                              }`}
                          >
                            <span className="text-lg">{pattern.icon}</span>
                            <span className="text-[10px] font-medium">{pattern.label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Tint with Theme Toggle */}
                      <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${config.gridTintWithTheme
                        ? 'bg-purple-50 border-purple-200'
                        : 'bg-gray-50 border-gray-100 hover:border-purple-200'
                        }`}>
                        <input
                          type="checkbox"
                          className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                          checked={config.gridTintWithTheme ?? false}
                          onChange={(e) => updateConfig({ gridTintWithTheme: e.target.checked })}
                        />
                        <div>
                          <span className="text-xs font-semibold text-gray-700">Tingir com Cor do Tema</span>
                          <p className="text-[10px] text-gray-500">Usa a cor do tema selecionado como fundo</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB: ALUNOS */}
          {activeTab === 'students' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Import Section */}
              <section className="p-5 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                    <DocumentArrowUpIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">Importação em Lote</h3>
                    <p className="text-xs text-gray-500">Excel, CSV ou do Banco Global</p>
                  </div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${importMode === 'append' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                    {importMode === 'append' ? 'Anexar' : 'Sobrescrever'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={downloadTemplate}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-blue-200 transition-all shadow-sm"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5 text-blue-500" />
                    <span className="text-xs font-medium">Modelo</span>
                  </button>

                  <button
                    onClick={() => setShowMasterSelector(true)}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-emerald-200 transition-all shadow-sm"
                  >
                    <UserGroupIcon className="w-5 h-5 text-emerald-500" />
                    <span className="text-xs font-medium">Banco</span>
                  </button>

                  <label className="flex flex-col items-center justify-center gap-1.5 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all cursor-pointer shadow-sm">
                    <DocumentArrowUpIcon className="w-5 h-5" />
                    <span className="text-xs font-medium">Importar</span>
                    <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={importInputRef} onChange={handleImportSheet} />
                  </label>
                </div>

                {/* Import Mode Toggle */}
                <div className="flex rounded-xl overflow-hidden border border-blue-200 bg-blue-50 p-1">
                  <button
                    onClick={() => setImportMode('append')}
                    className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all ${importMode === 'append'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-blue-600 hover:bg-blue-100'
                      }`}
                  >
                    📎 Anexar à lista
                  </button>
                  <button
                    onClick={() => setImportMode('replace')}
                    className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all ${importMode === 'replace'
                      ? 'bg-white text-amber-700 shadow-sm'
                      : 'text-blue-600 hover:bg-blue-100'
                      }`}
                  >
                    🔄 Sobrescrever
                  </button>
                </div>
              </section>

              {/* Student Form */}
              <section className="p-5 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                    <PlusIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{editingId ? 'Editar Aluno' : 'Adicionar Aluno'}</h3>
                    <p className="text-xs text-gray-500">{students.length} alunos no projeto</p>
                  </div>
                </div>
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
              </section>

              {/* Filters */}
              <section className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <FilterBar
                  filters={filters}
                  onYearChange={setYearFilter}
                  onCourseChange={setCourseFilter}
                  onClear={clearFilters}
                  hasActiveFilters={hasActiveFilters}
                  totalCount={students.length}
                  filteredCount={filteredStudents.length}
                />
              </section>

              {/* Student List */}
              <section className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
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
              </section>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Preview */}
      <div className="w-full md:w-1/2 bg-gray-100 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
        {/* Top bar: Preview controls + pagination */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 flex flex-col items-center gap-3">
          <PreviewControls
            scale={previewScale}
            onScaleChange={setPreviewScale}
            showMobileFrame={showMobileFrame}
            onToggleMobileFrame={() => setShowMobileFrame(!showMobileFrame)}
          />
          <div className="flex flex-wrap items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-gray-100">
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
          className={`transition - all duration - 300 ${showMobileFrame ? 'p-4 bg-gray-900 rounded-[2.5rem] shadow-2xl' : ''} `}
          style={{ transform: `scale(${previewScale})` }}
        >
          {showMobileFrame && (
            <div className="w-full flex justify-center mb-2">
              <div className="w-20 h-1.5 bg-gray-700 rounded-full" />
            </div>
          )}
          <div className={`shadow - 2xl ${showMobileFrame ? 'rounded-xl overflow-hidden' : ''} `}>
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

      {showMasterSelector && (
        <MasterStudentSelector
          students={masterStudents}
          onImport={handleImportFromSelector}
          onCancel={() => setShowMasterSelector(false)}
        />
      )}
    </div>
  );
}

