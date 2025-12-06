import React, { useMemo, useState } from 'react';
import { SCHOOL_YEARS, SCHOOL_COURSES } from '../types';
import { CheckCircleIcon, ArrowDownOnSquareStackIcon, PencilSquareIcon, TrashIcon, MagnifyingGlassIcon, PlusIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ImageCropper } from './ImageCropper';

interface MasterStudent {
  id: string;
  name: string;
  year: string | null;
  course: string;
  imageUrl: string | null;
  entryYear?: number | null;
  durationYears?: number | null;
  classCode?: string | null;
}

interface MasterStudentsPanelProps {
  students: MasterStudent[];
  loading: boolean;
  error: string | null;
  filters: { search: string; year: string | null; course: string | null };
  setFilters: (f: { search: string; year: string | null; course: string | null }) => void;
  selectedIds: Set<string>;
  toggleSelected: (id: string) => void;
  clearSelection: () => void;
  createOrUpdate: (payload: { id?: string; name: string; year: string | null; course: string; imageUrl: string | null; entryYear?: number | null; durationYears?: number | null; classCode?: string | null }) => Promise<void>;
  remove: (id: string) => Promise<void>;
  editing: MasterStudent | null;
  setEditing: (s: MasterStudent | null) => void;
  sendSelected: () => void;
  canUse: boolean;
}

// Skeleton component for loading state
function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
      <div className="w-4 h-4 rounded bg-gray-200" />
      <div className="w-11 h-11 rounded-xl bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

export function MasterStudentsPanel({
  students,
  loading,
  error,
  filters,
  setFilters,
  selectedIds,
  toggleSelected,
  clearSelection,
  createOrUpdate,
  remove,
  editing,
  setEditing,
  sendSelected,
  canUse,
}: MasterStudentsPanelProps) {
  const [formName, setFormName] = useState('');
  const [formYear, setFormYear] = useState(SCHOOL_YEARS[0]);
  const [formCourse, setFormCourse] = useState(SCHOOL_COURSES[0]);
  const [formImage, setFormImage] = useState<string | null>(null);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [formEntryYear, setFormEntryYear] = useState<number | null>(null);
  const [formDuration, setFormDuration] = useState<number>(3);

  const selectedCount = selectedIds.size;

  const classCodePreview = useMemo(() => {
    if (!formEntryYear) return '';
    const dur = formDuration > 0 ? formDuration : 3;
    const exitYear = formEntryYear + dur;
    const courseCode = formCourse.replace(/\s+/g, '').toUpperCase().slice(0, 6);
    return `${courseCode}-${formEntryYear}-${exitYear}`;
  }, [formCourse, formDuration, formEntryYear]);

  const handleSubmit = async () => {
    if (!formName.trim()) return;
    await createOrUpdate({
      id: editing?.id,
      name: formName,
      year: formYear,
      course: formCourse,
      imageUrl: formImage,
      entryYear: formEntryYear,
      durationYears: formDuration,
    });
    setFormName('');
    setFormYear(SCHOOL_YEARS[0]);
    setFormCourse(SCHOOL_COURSES[0]);
    setFormImage(null);
    setFormEntryYear(null);
    setFormDuration(3);
    setEditing(null);
  };

  const startEdit = (s: MasterStudent) => {
    setEditing(s);
    setFormName(s.name);
    setFormYear(s.year || SCHOOL_YEARS[0]);
    setFormCourse(s.course || SCHOOL_COURSES[0]);
    setFormImage(s.imageUrl || null);
    setFormEntryYear(s.entryYear ?? null);
    setFormDuration(s.durationYears ?? 3);
  };

  const cancelEdit = () => {
    setEditing(null);
    setFormName('');
    setFormYear(SCHOOL_YEARS[0]);
    setFormCourse(SCHOOL_COURSES[0]);
    setFormImage(null);
    setFormEntryYear(null);
    setFormDuration(3);
  };

  const filteredList = useMemo(() => students, [students]);

  return (
    <div className="space-y-5">
      {cropperImage && (
        <ImageCropper
          imageUrl={cropperImage}
          onConfirm={(img) => {
            setFormImage(img);
            setCropperImage(null);
          }}
          onCancel={() => setCropperImage(null)}
        />
      )}

      {/* Search & Filters */}
      <section className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <MagnifyingGlassIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">Buscar Alunos</h3>
            <p className="text-xs text-gray-500">{students.length} alunos no banco</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl flex-1 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Digite o nome do aluno..."
              className="flex-1 px-2 bg-transparent text-sm outline-none"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            {filters.search && (
              <button onClick={() => setFilters({ ...filters, search: '' })} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <XMarkIcon className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <select
              className="px-3 py-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all"
              value={filters.year || ''}
              onChange={(e) => setFilters({ ...filters, year: e.target.value || null })}
            >
              <option value="">Todos os Anos</option>
              {SCHOOL_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              className="px-3 py-2.5 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none transition-all"
              value={filters.course || ''}
              onChange={(e) => setFilters({ ...filters, course: e.target.value || null })}
            >
              <option value="">Todos os Cursos</option>
              {SCHOOL_COURSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Add/Edit Form */}
      <section className={`p-5 rounded-2xl shadow-sm space-y-4 transition-all duration-300 ${editing ? 'bg-amber-50 border-2 border-amber-200' : 'bg-white border border-gray-100'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${editing ? 'bg-amber-100' : 'bg-emerald-50'}`}>
            <PlusIcon className={`w-5 h-5 ${editing ? 'text-amber-600' : 'text-emerald-600'}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">{editing ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}</h3>
            <p className="text-xs text-gray-500">Dados salvos no banco global</p>
          </div>
          {editing && (
            <button
              onClick={cancelEdit}
              className="text-xs text-amber-700 hover:text-amber-800 font-medium px-3 py-1.5 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>

        <div className="flex gap-4">
          <label className="relative w-24 h-24 flex-shrink-0 cursor-pointer group">
            <div className={`w-full h-full rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-white transition-all duration-200 ${formImage ? 'border-emerald-400 shadow-sm' : 'border-gray-300 group-hover:border-emerald-400 group-hover:bg-emerald-50/50'}`}>
              {formImage ? (
                <img src={formImage} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <div className="text-center p-2">
                  <PhotoIcon className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                  <span className="text-[10px] text-gray-400 block">Adicionar foto</span>
                </div>
              )}
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    if (event.target?.result) setCropperImage(event.target.result as string);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            {formImage && (
              <button
                onClick={(e) => { e.preventDefault(); setFormImage(null); }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </label>

          <div className="flex-1 space-y-3">
            <input
              type="text"
              placeholder="Nome completo do aluno"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none transition-all"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
            <div className="flex gap-2">
              <select
                className="w-1/3 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                value={formYear}
                onChange={(e) => setFormYear(e.target.value)}
              >
                {SCHOOL_YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select
                className="w-2/3 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                value={formCourse}
                onChange={(e) => setFormCourse(e.target.value)}
              >
                {SCHOOL_COURSES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Ano de ingresso"
                className="w-1/2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                value={formEntryYear ?? ''}
                onChange={(e) => setFormEntryYear(e.target.value ? Number(e.target.value) : null)}
              />
              <input
                type="number"
                min={1}
                max={5}
                placeholder="Duração (anos)"
                className="w-1/2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 transition-all"
                value={formDuration}
                onChange={(e) => setFormDuration(Number(e.target.value) || 3)}
              />
            </div>
            {classCodePreview && (
              <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg inline-block">
                Código: <span className="font-mono font-medium text-gray-700">{classCodePreview}</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${editing ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/20' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20'}`}
          disabled={!formName.trim() || !canUse}
        >
          {editing ? 'Salvar Alterações' : 'Cadastrar Aluno'}
        </button>
        {!canUse && <p className="text-xs text-red-500 text-center">Faça login para salvar no banco.</p>}
        {error && <p className="text-xs text-red-500 text-center">{error}</p>}
      </section>

      {/* Student List */}
      <section className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <ArrowDownOnSquareStackIcon className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">Alunos Cadastrados</h3>
            <p className="text-xs text-gray-500">{loading ? 'Carregando...' : `${filteredList.length} alunos encontrados`}</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedCount > 0 && (
              <>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                  {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
                </span>
                <button
                  onClick={sendSelected}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Enviar para projeto
                </button>
                <button
                  onClick={clearSelection}
                  className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                >
                  Limpar
                </button>
              </>
            )}
          </div>
        </div>

        <div className="border border-gray-100 rounded-xl max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="divide-y divide-gray-50">
              {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircleIcon className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500">Nenhum aluno encontrado</p>
              <p className="text-xs text-gray-400 mt-1">Cadastre um novo aluno acima</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredList.map((s) => {
                const checked = selectedIds.has(s.id);
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 cursor-pointer ${checked ? 'bg-emerald-50/50' : 'hover:bg-gray-50'}`}
                    onClick={() => toggleSelected(s.id)}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${checked ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 bg-white'}`}>
                      {checked && <CheckCircleIcon className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className={`w-11 h-11 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${checked ? 'border-emerald-400 shadow-sm' : 'border-gray-100 bg-gray-100'}`}>
                      {s.imageUrl ? (
                        <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 text-sm font-bold">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate transition-colors ${checked ? 'text-emerald-900' : 'text-gray-900'}`}>{s.name}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {[s.year, s.course].filter(Boolean).join(' • ') || 'Sem turma'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => startEdit(s)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                        title="Editar"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => remove(s.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Remover"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
