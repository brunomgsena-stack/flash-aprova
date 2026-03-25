'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// ─── Theme ───────────────────────────────────────────────────────────────────

const PURPLE        = '#7C3AED';
const PURPLE_DIM    = 'rgba(124,58,237,0.12)';
const PURPLE_BORDER = 'rgba(124,58,237,0.35)';
const PURPLE_GLOW   = 'rgba(124,58,237,0.25)';

// ─── Types ───────────────────────────────────────────────────────────────────

type RawRow = {
  rowNum: number;
  subject_name: string;
  module_name: string;
  deck_name: string;
  summary_markdown: string;
  mnemonics: string;
  question: string;
  answer: string;
};

type DBSubject = { id: string; title: string };
type DBModule  = { id: string; title: string; subject_id: string };

type ValidatedRow = RawRow & {
  subjectId: string | null;
  moduleId:  string | null;
  rowErrors: string[];
};

type ImportResult = {
  cardsInserted: number;
  decksCreated:  number;
  decksUpdated:  number;
  errors:        string[];
};

// ─── CSV parser ───────────────────────────────────────────────────────────────

function parseLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseCSV(text: string): { rows: RawRow[]; errors: string[] } {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return { rows: [], errors: ['Arquivo vazio ou sem dados.'] };

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));

  // Required new columns; also accept front/back as aliases
  const requiredCols = ['subject_name', 'module_name', 'deck_name', 'question', 'answer'];
  const aliasMap: Record<string, string> = { front: 'question', back: 'answer' };

  // Normalise header aliases
  const normHeaders = headers.map(h => aliasMap[h] ?? h);

  const missing = requiredCols.filter(r => !normHeaders.includes(r));
  if (missing.length > 0) {
    return { rows: [], errors: [`Colunas faltando: ${missing.join(', ')}`] };
  }

  const rows: RawRow[] = [];
  const errors: string[] = [];

  lines.slice(1).forEach((line, i) => {
    if (!line.trim()) return;
    const vals = parseLine(line);
    const raw  = Object.fromEntries(normHeaders.map((h, j) => [h, vals[j] ?? ''])) as Record<string, string>;

    if (!raw.question || !raw.answer) {
      errors.push(`Linha ${i + 2}: campos question/answer (ou front/back) vazios`);
      return;
    }

    rows.push({
      rowNum:           i + 2,
      subject_name:     (raw.subject_name ?? '').trim(),
      module_name:      (raw.module_name ?? '').trim(),
      deck_name:        (raw.deck_name ?? '').trim(),
      summary_markdown: (raw.summary_markdown ?? '').trim(),
      mnemonics:        (raw.mnemonics ?? '').trim(),
      question:         raw.question,
      answer:           raw.answer,
    });
  });

  return { rows, errors };
}

// ─── Validation (pure, no DB calls) ──────────────────────────────────────────

function validate(
  rows: RawRow[],
  subjects: DBSubject[],
  modules: DBModule[],
  subjectOverrides: Map<string, string>,
  moduleOverrides: Map<string, string>,
): ValidatedRow[] {
  return rows.map(row => {
    const errors: string[] = [];

    // Find subject
    let subjectId = subjectOverrides.get(row.subject_name) ?? null;
    if (!subjectId) {
      const found = subjects.find(s => s.title.toLowerCase() === row.subject_name.toLowerCase());
      subjectId = found?.id ?? null;
    }
    if (!subjectId) errors.push(`Matéria "${row.subject_name}" não encontrada`);

    // Find module (only if subject resolved)
    let moduleId = subjectId ? (moduleOverrides.get(`${row.module_name}::${subjectId}`) ?? null) : null;
    if (!moduleId && subjectId) {
      const found = modules.find(
        m => m.subject_id === subjectId && m.title.toLowerCase() === row.module_name.toLowerCase(),
      );
      moduleId = found?.id ?? null;
    }
    if (!moduleId && subjectId) {
      errors.push(`Módulo "${row.module_name}" não encontrado em ${row.subject_name}`);
    }

    return { ...row, subjectId, moduleId, rowErrors: errors };
  });
}

// ─── Import logic ─────────────────────────────────────────────────────────────

async function importRows(
  validatedRows: ValidatedRow[],
  replaceCards: boolean,
  onProgress: (pct: number, msg: string) => void,
): Promise<ImportResult> {
  const result: ImportResult = { cardsInserted: 0, decksCreated: 0, decksUpdated: 0, errors: [] };

  onProgress(5, 'Buscando matérias...');
  // subjects/modules already resolved during validation — skip to deck upsert
  onProgress(15, 'Verificando módulos...');

  // Collect unique deck keys
  const deckMap = new Map<string, string>(); // `${subjectId}::${moduleId}::${deck_name}` → id

  type DeckGroup = {
    key: string;
    subjectId: string;
    moduleId: string;
    deck_name: string;
    summary_markdown: string;
    mnemonics: string;
  };

  const deckGroups = new Map<string, DeckGroup>();
  for (const row of validatedRows) {
    if (!row.subjectId || !row.moduleId) continue;
    const key = `${row.subjectId}::${row.moduleId}::${row.deck_name}`;
    if (!deckGroups.has(key)) {
      deckGroups.set(key, {
        key,
        subjectId: row.subjectId,
        moduleId:  row.moduleId,
        deck_name: row.deck_name,
        summary_markdown: row.summary_markdown,
        mnemonics: row.mnemonics,
      });
    }
  }

  onProgress(30, 'Upserting decks e inserindo cards...');

  // Upsert all decks in parallel
  await Promise.all(
    Array.from(deckGroups.values()).map(async ({ key, subjectId, moduleId, deck_name, summary_markdown, mnemonics }) => {
      const { data: existing } = await supabase
        .from('decks')
        .select('id')
        .eq('title', deck_name)
        .eq('subject_id', subjectId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('decks')
          .update({ summary_markdown, mnemonics, module_id: moduleId })
          .eq('id', existing.id);
        if (!error) {
          deckMap.set(key, existing.id);
          result.decksUpdated++;
          // If replace mode, wipe existing cards so we get a clean import
          if (replaceCards) {
            await supabase.from('cards').delete().eq('deck_id', existing.id);
          }
        } else {
          result.errors.push(`Deck update "${deck_name}": ${error.message}`);
        }
      } else {
        const { data, error } = await supabase
          .from('decks')
          .insert({ title: deck_name, subject_id: subjectId, module_id: moduleId, summary_markdown, mnemonics })
          .select('id')
          .single();
        if (data) {
          deckMap.set(key, data.id);
          result.decksCreated++;
        } else {
          result.errors.push(`Deck insert "${deck_name}": ${error?.message}`);
        }
      }
    }),
  );

  // Build card rows
  const cardRows = validatedRows
    .map(r => {
      if (!r.subjectId || !r.moduleId) return null;
      const key    = `${r.subjectId}::${r.moduleId}::${r.deck_name}`;
      const deckId = deckMap.get(key);
      return deckId ? { question: r.question, answer: r.answer, deck_id: deckId } : null;
    })
    .filter((x): x is { question: string; answer: string; deck_id: string } => x !== null);

  const BATCH = 100;
  for (let i = 0; i < cardRows.length; i += BATCH) {
    const batch = cardRows.slice(i, i + BATCH);
    const { error } = await supabase.from('cards').insert(batch);
    if (!error) {
      result.cardsInserted += batch.length;
    } else {
      result.errors.push(`Lote ${Math.floor(i / BATCH) + 1}: ${error.message}`);
    }
    onProgress(
      30 + Math.round(((i + batch.length) / Math.max(cardRows.length, 1)) * 55),
      `Inserindo cards… ${Math.min(i + BATCH, cardRows.length)} / ${cardRows.length}`,
    );
  }

  return result;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminImporter() {
  const router = useRouter();

  const [isDragging,       setIsDragging]       = useState(false);
  const [phase,            setPhase]            = useState<'idle' | 'validating' | 'preview' | 'importing' | 'done'>('idle');
  const [file,             setFile]             = useState<File | null>(null);
  const [rawRows,          setRawRows]          = useState<RawRow[]>([]);
  const [parseErrors,      setParseErrors]      = useState<string[]>([]);
  const [dbSubjects,       setDbSubjects]       = useState<DBSubject[]>([]);
  const [dbModules,        setDbModules]        = useState<DBModule[]>([]);
  const [subjectOverrides, setSubjectOverrides] = useState<Map<string, string>>(new Map());
  const [moduleOverrides,  setModuleOverrides]  = useState<Map<string, string>>(new Map());
  const [replaceCards,     setReplaceCards]     = useState(true);
  const [progress,         setProgress]         = useState(0);
  const [progressMsg,      setProgressMsg]      = useState('');
  const [result,           setResult]           = useState<ImportResult | null>(null);

  // Derived validated rows (recomputed whenever inputs change)
  const validatedRows = useMemo<ValidatedRow[]>(() => {
    if (rawRows.length === 0) return [];
    return validate(rawRows, dbSubjects, dbModules, subjectOverrides, moduleOverrides);
  }, [rawRows, dbSubjects, dbModules, subjectOverrides, moduleOverrides]);

  const allValid = validatedRows.length > 0 && validatedRows.every(r => r.rowErrors.length === 0);

  // Summary counts
  const uniqueSubjects = useMemo(() => new Set(rawRows.map(r => r.subject_name)).size, [rawRows]);
  const uniqueModules  = useMemo(() => new Set(rawRows.map(r => r.module_name)).size,  [rawRows]);
  const uniqueDecks    = useMemo(() => new Set(rawRows.map(r => r.deck_name)).size,    [rawRows]);

  // Unique invalid subject names
  const invalidSubjectNames = useMemo(() => {
    const names = new Set<string>();
    validatedRows.forEach(r => {
      if (!r.subjectId) names.add(r.subject_name);
    });
    return Array.from(names);
  }, [validatedRows]);

  // Unique invalid module situations: { module_name, subject_name, subjectId }
  const invalidModules = useMemo(() => {
    const seen = new Map<string, { module_name: string; subject_name: string; subjectId: string }>();
    validatedRows.forEach(r => {
      if (r.subjectId && !r.moduleId) {
        const key = `${r.module_name}::${r.subjectId}`;
        if (!seen.has(key)) seen.set(key, { module_name: r.module_name, subject_name: r.subject_name, subjectId: r.subjectId });
      }
    });
    return Array.from(seen.values());
  }, [validatedRows]);

  // ── File handling ──────────────────────────────────────────────────────────

  const handleFile = useCallback(async (f: File) => {
    if (!f.name.endsWith('.csv')) { alert('Apenas arquivos .csv são aceitos.'); return; }
    setFile(f);
    setResult(null);
    setSubjectOverrides(new Map());
    setModuleOverrides(new Map());
    setPhase('validating');

    const text: string = await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = e => res(e.target?.result as string);
      reader.onerror = rej;
      reader.readAsText(f, 'utf-8');
    });

    const { rows, errors } = parseCSV(text);
    setRawRows(rows);
    setParseErrors(errors);

    // Fetch DB data in parallel
    const [subjectsRes, modulesRes] = await Promise.all([
      supabase.from('subjects').select('id, title'),
      supabase.from('modules').select('id, title, subject_id'),
    ]);

    setDbSubjects((subjectsRes.data as DBSubject[]) ?? []);
    setDbModules((modulesRes.data as DBModule[]) ?? []);
    setPhase('preview');
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onImport = async () => {
    if (!allValid) return;
    setPhase('importing');
    setProgress(0);
    setProgressMsg('Iniciando importação...');
    const r = await importRows(validatedRows, replaceCards, (pct, msg) => {
      setProgress(pct);
      setProgressMsg(msg);
    });
    setResult(r);
    setProgress(100);
    setProgressMsg('Concluído!');
    setPhase('done');
  };

  const reset = () => {
    setFile(null);
    setRawRows([]);
    setParseErrors([]);
    setDbSubjects([]);
    setDbModules([]);
    setSubjectOverrides(new Map());
    setModuleOverrides(new Map());
    setResult(null);
    setProgress(0);
    setPhase('idle');
  };

  const handleSubjectOverride = (subjectName: string, subjectId: string) => {
    setSubjectOverrides(prev => {
      const next = new Map(prev);
      next.set(subjectName, subjectId);
      return next;
    });
  };

  const handleModuleOverride = (moduleTitle: string, subjectId: string, moduleId: string) => {
    setModuleOverrides(prev => {
      const next = new Map(prev);
      next.set(`${moduleTitle}::${subjectId}`, moduleId);
      return next;
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const isIdle      = phase === 'idle';
  const isPreview   = phase === 'preview';
  const isValidating = phase === 'validating';
  const isImporting = phase === 'importing';
  const isDone      = phase === 'done';

  return (
    <main className="min-h-screen px-4 py-12 sm:px-8">
      <div className="max-w-4xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
              style={{ color: PURPLE, background: PURPLE_DIM, border: `1px solid ${PURPLE_BORDER}` }}
            >
              ⚙ Painel Admin
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">Importar Cards</h1>
          <p className="text-slate-400 mt-2 text-sm">
            CSV com as colunas:{' '}
            <code
              className="px-1.5 py-0.5 rounded text-xs"
              style={{ background: 'rgba(255,255,255,0.07)', color: PURPLE }}
            >
              subject_name, module_name, deck_name, summary_markdown, mnemonics, question, answer
            </code>
          </p>
        </div>

        {/* ── Phase 1: Drop zone (idle or validating) ──────────────────── */}
        {(isIdle || isValidating) && (
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => !file && document.getElementById('csv-input')?.click()}
            className="relative rounded-2xl overflow-hidden transition-all duration-300"
            style={{
              background:  isDragging ? 'rgba(124,58,237,0.07)' : 'rgba(255,255,255,0.03)',
              border:      `2px dashed ${isDragging ? PURPLE : PURPLE_BORDER}`,
              boxShadow:   isDragging ? `0 0 40px ${PURPLE_GLOW}` : 'none',
              cursor:      file ? 'default' : 'pointer',
              minHeight:   '230px',
            }}
          >
            {/* Radial background glow */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.06) 0%, transparent 70%)',
                opacity: isDragging ? 1 : 0.6,
              }}
            />
            {/* Top shimmer line */}
            <div
              className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: `linear-gradient(90deg, transparent, ${PURPLE}55, transparent)` }}
            />

            <input
              id="csv-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />

            {isValidating ? (
              <div className="flex flex-col items-center justify-center text-center p-12 relative z-10">
                <div
                  className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mb-4"
                  style={{ borderColor: PURPLE, borderTopColor: 'transparent' }}
                />
                <p className="text-white font-semibold">Validando dados...</p>
                <p className="text-slate-500 text-sm mt-1">Consultando matérias e módulos no banco</p>
              </div>
            ) : !file ? (
              /* ── Empty state ── */
              <div className="flex flex-col items-center justify-center text-center p-12 relative z-10">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5"
                  style={{ background: PURPLE_DIM, border: `1px solid ${PURPLE_BORDER}` }}
                >
                  📂
                </div>
                <p className="text-white font-semibold text-lg">Arraste seu arquivo CSV aqui</p>
                <p className="text-slate-500 text-sm mt-1">ou clique para selecionar</p>
                <p className="text-slate-600 text-xs mt-3">
                  Colunas: subject_name, module_name, deck_name, summary_markdown, mnemonics, question, answer
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* ── Phase 2: Preview + Validation ───────────────────────────── */}
        {isPreview && (
          <div className="space-y-5">

            {/* Parse errors */}
            {parseErrors.length > 0 && (
              <div
                className="p-3 rounded-xl text-xs text-orange-300"
                style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)' }}
              >
                {parseErrors.slice(0, 5).map((err, i) => <p key={i}>⚠ {err}</p>)}
                {parseErrors.length > 5 && (
                  <p className="text-slate-500 mt-1">…e mais {parseErrors.length - 5} avisos</p>
                )}
              </div>
            )}

            {/* File pill + summary header */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${PURPLE_BORDER}` }}
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="text-2xl">📄</span>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-semibold truncate">{file?.name}</p>
                  <p className="text-slate-400 text-sm" style={{ color: PURPLE }}>
                    {rawRows.length} cards em {uniqueDecks} decks, {uniqueModules} módulos, {uniqueSubjects} matérias
                  </p>
                </div>
                <button
                  onClick={reset}
                  className="text-slate-500 hover:text-white transition-colors text-lg shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* Subject override dropdowns */}
              {invalidSubjectNames.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-red-400 font-semibold mb-1">Corrija as matérias não encontradas:</p>
                  {invalidSubjectNames.map(subjectName => (
                    <div key={subjectName} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 min-w-0 flex-1 truncate">
                        Corrigir: <span className="text-red-300 font-mono">{subjectName}</span>
                      </span>
                      <select
                        className="text-xs rounded-lg px-2 py-1.5 bg-slate-800 text-white border border-slate-600 focus:outline-none focus:border-purple-500"
                        value={subjectOverrides.get(subjectName) ?? ''}
                        onChange={e => handleSubjectOverride(subjectName, e.target.value)}
                      >
                        <option value="">— selecione a matéria —</option>
                        {dbSubjects.map(s => (
                          <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* Module override dropdowns */}
              {invalidModules.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-orange-400 font-semibold mb-1">Corrija os módulos não encontrados:</p>
                  {invalidModules.map(({ module_name, subject_name, subjectId }) => (
                    <div key={`${module_name}::${subjectId}`} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 min-w-0 flex-1 truncate">
                        Corrigir: <span className="text-orange-300 font-mono">{module_name}</span>
                        <span className="text-slate-500"> em {subject_name}</span>
                      </span>
                      <select
                        className="text-xs rounded-lg px-2 py-1.5 bg-slate-800 text-white border border-slate-600 focus:outline-none focus:border-purple-500"
                        value={moduleOverrides.get(`${module_name}::${subjectId}`) ?? ''}
                        onChange={e => handleModuleOverride(module_name, subjectId, e.target.value)}
                      >
                        <option value="">— selecione o módulo —</option>
                        {dbModules
                          .filter(m => m.subject_id === subjectId)
                          .map(m => (
                            <option key={m.id} value={m.id}>{m.title}</option>
                          ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {/* Replace cards toggle */}
              <label
                className="flex items-center gap-3 cursor-pointer mb-3 px-1 py-2 rounded-lg select-none"
                style={{ background: replaceCards ? 'rgba(124,58,237,0.08)' : 'transparent' }}
              >
                <div
                  className="w-9 h-5 rounded-full relative transition-all duration-200 shrink-0"
                  style={{ background: replaceCards ? PURPLE : 'rgba(255,255,255,0.12)' }}
                  onClick={() => setReplaceCards(v => !v)}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200"
                    style={{ left: replaceCards ? '18px' : '2px' }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium">Substituir cards existentes</p>
                  <p className="text-slate-500 text-xs">
                    {replaceCards
                      ? 'Os cards antigos de cada deck atualizado serão apagados antes de reinserir. Recomendado para reimportações.'
                      : 'Novos cards serão adicionados sem remover os existentes.'}
                  </p>
                </div>
              </label>

              {/* Import button */}
              <div className="relative group">
                <button
                  onClick={onImport}
                  disabled={!allValid}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-base transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  style={{
                    background: allValid
                      ? `linear-gradient(135deg, ${PURPLE}, #5b21b6)`
                      : 'rgba(124,58,237,0.3)',
                    boxShadow: allValid
                      ? `0 0 24px ${PURPLE_GLOW}, 0 4px 12px rgba(0,0,0,0.4)`
                      : 'none',
                  }}
                >
                  Importar {rawRows.length} cards →
                </button>
                {!allValid && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs text-white bg-slate-800 border border-slate-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Corrija os erros antes de importar
                  </div>
                )}
              </div>
            </div>

            {/* Preview table */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: `1px solid ${PURPLE_BORDER}` }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: PURPLE_DIM }}>
                      <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs w-10">#</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs">Matéria</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs">Módulo</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs">Deck</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs">Pergunta</th>
                      <th className="text-left px-4 py-3 text-slate-400 font-semibold text-xs">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validatedRows.slice(0, 8).map((row, i) => {
                      const isInvalid = row.rowErrors.length > 0;
                      return (
                        <tr
                          key={i}
                          style={{
                            background: isInvalid ? 'rgba(239,68,68,0.08)' : 'transparent',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            ...(isInvalid ? { borderLeft: '2px solid rgba(239,68,68,0.4)' } : {}),
                          }}
                        >
                          <td className="px-4 py-3 text-slate-500 text-xs font-mono">{row.rowNum}</td>
                          <td className="px-4 py-3 text-slate-300 text-xs max-w-24 truncate">{row.subject_name}</td>
                          <td className="px-4 py-3 text-slate-300 text-xs max-w-24 truncate">{row.module_name}</td>
                          <td className="px-4 py-3 text-slate-300 text-xs max-w-28 truncate">{row.deck_name}</td>
                          <td className="px-4 py-3 text-slate-300 text-xs max-w-48">
                            <span title={row.question}>
                              {row.question.length > 40 ? row.question.slice(0, 40) + '…' : row.question}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">
                            {isInvalid ? (
                              <span className="text-red-400">
                                {row.rowErrors.map((e, ei) => (
                                  <span key={ei} className="block">⚠ {
                                    e.includes('Matéria') ? 'Matéria não encontrada' : 'Módulo não encontrado'
                                  }</span>
                                ))}
                              </span>
                            ) : (
                              <span className="text-green-400">✓</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {validatedRows.length > 8 && (
                <div
                  className="px-4 py-3 text-xs text-slate-500"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                >
                  + {validatedRows.length - 8} mais
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Phase 3: Importing (progress) ───────────────────────────── */}
        {isImporting && (
          <div
            className="relative rounded-2xl p-8"
            style={{
              background:  'rgba(255,255,255,0.03)',
              border:      `1px solid ${PURPLE_BORDER}`,
              boxShadow:   `0 0 40px ${PURPLE_GLOW}`,
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
              style={{ background: `linear-gradient(90deg, transparent, ${PURPLE}77, transparent)` }}
            />

            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                style={{ borderColor: PURPLE, borderTopColor: 'transparent' }}
              />
              <p className="text-white font-semibold">{progressMsg}</p>
            </div>

            <div className="w-full h-3 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width:      `${progress}%`,
                  background: `linear-gradient(90deg, ${PURPLE}, #5b21b6)`,
                  boxShadow:  `0 0 14px ${PURPLE_GLOW}`,
                }}
              />
            </div>
            <p className="text-right text-slate-500 text-sm font-semibold">{progress}%</p>
          </div>
        )}

        {/* ── Phase 4: Result ─────────────────────────────────────────── */}
        {isDone && result && (
          <div
            className="relative rounded-2xl p-8"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border:     '1px solid rgba(0,255,128,0.3)',
              boxShadow:  '0 0 40px rgba(0,255,128,0.08)',
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,128,0.4), transparent)' }}
            />

            <div className="flex items-center gap-4 mb-7">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: 'rgba(0,255,128,0.1)', border: '1px solid rgba(0,255,128,0.3)' }}
              >
                ✅
              </div>
              <div>
                <h2 className="text-white font-bold text-xl">Importação concluída!</h2>
                <p className="text-slate-400 text-sm">Dados enviados ao Supabase com sucesso.</p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Cards inseridos', value: result.cardsInserted, color: '#00ff80' },
                { label: 'Decks criados',   value: result.decksCreated,  color: PURPLE    },
                { label: 'Decks atualizados', value: result.decksUpdated, color: '#00e5ff' },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="rounded-xl p-4 text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}33` }}
                >
                  <p className="text-3xl font-bold" style={{ color }}>{value}</p>
                  <p className="text-slate-400 text-xs mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Errors (if any) */}
            {result.errors.length > 0 && (
              <div
                className="p-3 rounded-xl text-xs text-orange-300 mb-5"
                style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)' }}
              >
                <p className="font-semibold mb-1">⚠ {result.errors.length} erros durante a importação:</p>
                {result.errors.slice(0, 8).map((err, i) => <p key={i}>{err}</p>)}
                {result.errors.length > 8 && (
                  <p className="text-slate-500 mt-1">…e mais {result.errors.length - 8}</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 py-3 rounded-xl font-semibold transition-all duration-200 hover:-translate-y-0.5"
                style={{ color: PURPLE, background: PURPLE_DIM, border: `1px solid ${PURPLE_BORDER}` }}
              >
                Importar outro arquivo
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="flex-1 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'rgba(0,255,128,0.12)', border: '1px solid rgba(0,255,128,0.35)' }}
              >
                Ver Dashboard →
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
