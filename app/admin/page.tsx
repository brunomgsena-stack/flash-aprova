'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// ─── Theme ───────────────────────────────────────────────────────────────────

const PINK        = '#f72585';
const PINK_DIM    = 'rgba(247,37,133,0.12)';
const PINK_BORDER = 'rgba(247,37,133,0.35)';
const PINK_GLOW   = 'rgba(247,37,133,0.25)';

// ─── Types ───────────────────────────────────────────────────────────────────

type CSVRow = {
  subject_name: string;
  deck_name:    string;
  front:        string;
  back:         string;
};

type ImportResult = {
  cardsInserted:    number;
  subjectsCreated:  number;
  decksCreated:     number;
  errors:           string[];
};

// ─── CSV parser (handles quoted fields with commas inside) ───────────────────

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

function parseCSV(text: string): { rows: CSVRow[]; errors: string[] } {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return { rows: [], errors: ['Arquivo vazio ou sem dados.'] };

  const headers  = parseLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const required = ['subject_name', 'deck_name', 'front', 'back'];
  const missing  = required.filter(r => !headers.includes(r));
  if (missing.length > 0) {
    return { rows: [], errors: [`Colunas faltando: ${missing.join(', ')}`] };
  }

  const rows: CSVRow[] = [];
  const errors: string[] = [];

  lines.slice(1).forEach((line, i) => {
    if (!line.trim()) return;
    const vals = parseLine(line);
    const row  = Object.fromEntries(headers.map((h, j) => [h, vals[j] ?? ''])) as Record<string, string>;
    if (!row.front || !row.back) {
      errors.push(`Linha ${i + 2}: campos front/back vazios`);
      return;
    }
    rows.push({
      subject_name: row.subject_name.trim(),
      deck_name:    row.deck_name.trim(),
      front:        row.front,
      back:         row.back,
    });
  });

  return { rows, errors };
}

// ─── Import logic ─────────────────────────────────────────────────────────────

async function importRows(
  rows: CSVRow[],
  onProgress: (pct: number, msg: string) => void,
): Promise<ImportResult> {
  const result: ImportResult = { cardsInserted: 0, subjectsCreated: 0, decksCreated: 0, errors: [] };

  const subjectMap = new Map<string, string>(); // name → id
  const deckMap    = new Map<string, string>(); // `${subjectId}::${deckName}` → id

  const subjectNames = [...new Set(rows.map(r => r.subject_name).filter(Boolean))];
  const deckKeys     = [...new Set(rows.map(r => `${r.subject_name}::${r.deck_name}`))];

  // 1. Create / find subjects
  onProgress(5, 'Verificando matérias…');
  for (const name of subjectNames) {
    const { data: existing } = await supabase
      .from('subjects')
      .select('id')
      .eq('title', name)
      .maybeSingle();

    if (existing) {
      subjectMap.set(name, existing.id);
    } else {
      const { data: created, error } = await supabase
        .from('subjects')
        .insert({ title: name, icon_url: 'book', color: '#7C3AED' })
        .select('id')
        .single();
      if (created) {
        subjectMap.set(name, created.id);
        result.subjectsCreated++;
      } else {
        result.errors.push(`Matéria "${name}": ${error?.message}`);
      }
    }
  }

  // 2. Create / find decks
  onProgress(20, 'Verificando decks…');
  for (const key of deckKeys) {
    const [subjectName, deckName] = key.split('::');
    const subjectId = subjectMap.get(subjectName);
    if (!subjectId) continue;

    const { data: existing } = await supabase
      .from('decks')
      .select('id')
      .eq('title', deckName)
      .eq('subject_id', subjectId)
      .maybeSingle();

    if (existing) {
      deckMap.set(`${subjectId}::${deckName}`, existing.id);
    } else {
      const { data: created, error } = await supabase
        .from('decks')
        .insert({ title: deckName, subject_id: subjectId })
        .select('id')
        .single();
      if (created) {
        deckMap.set(`${subjectId}::${deckName}`, created.id);
        result.decksCreated++;
      } else {
        result.errors.push(`Deck "${deckName}": ${error?.message}`);
      }
    }
  }

  // 3. Insert cards in batches of 100
  const cardRows = rows
    .map(r => {
      const subjectId = subjectMap.get(r.subject_name);
      const deckId    = subjectId ? deckMap.get(`${subjectId}::${r.deck_name}`) : undefined;
      return deckId ? { question: r.front, answer: r.back, deck_id: deckId } : null;
    })
    .filter(Boolean) as { question: string; answer: string; deck_id: string }[];

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
      30 + Math.round(((i + batch.length) / cardRows.length) * 70),
      `Inserindo cards… ${Math.min(i + BATCH, cardRows.length)} / ${cardRows.length}`,
    );
  }

  return result;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();

  const [isDragging,   setIsDragging]   = useState(false);
  const [file,         setFile]         = useState<File | null>(null);
  const [parsed,       setParsed]       = useState<{ rows: CSVRow[]; errors: string[] } | null>(null);
  const [importing,    setImporting]    = useState(false);
  const [progress,     setProgress]     = useState(0);
  const [progressMsg,  setProgressMsg]  = useState('');
  const [result,       setResult]       = useState<ImportResult | null>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.name.endsWith('.csv')) { alert('Apenas arquivos .csv são aceitos.'); return; }
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = e => setParsed(parseCSV(e.target?.result as string));
    reader.readAsText(f, 'utf-8');
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onImport = async () => {
    if (!parsed || parsed.rows.length === 0) return;
    setImporting(true);
    setProgress(0);
    setProgressMsg('Iniciando importação…');
    const r = await importRows(parsed.rows, (pct, msg) => {
      setProgress(pct);
      setProgressMsg(msg);
    });
    setResult(r);
    setProgress(100);
    setProgressMsg('Concluído!');
    setImporting(false);
  };

  const reset = () => { setFile(null); setParsed(null); setResult(null); setProgress(0); };

  return (
    <main className="min-h-screen px-4 py-12 sm:px-8">
      <div className="max-w-3xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span
              className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
              style={{ color: PINK, background: PINK_DIM, border: `1px solid ${PINK_BORDER}` }}
            >
              ⚙ Painel Admin
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight">Importar Cards</h1>
          <p className="text-slate-400 mt-2 text-sm">
            CSV com as colunas:{' '}
            <code
              className="px-1.5 py-0.5 rounded text-xs"
              style={{ background: 'rgba(255,255,255,0.07)', color: PINK }}
            >
              subject_name, deck_name, front, back
            </code>
          </p>
        </div>

        {/* ── Drop zone ───────────────────────────────────────────────── */}
        {!importing && !result && (
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => !file && document.getElementById('csv-input')?.click()}
            className="relative rounded-2xl overflow-hidden transition-all duration-300"
            style={{
              background:  isDragging ? 'rgba(247,37,133,0.07)' : 'rgba(255,255,255,0.03)',
              border:      `2px dashed ${isDragging ? PINK : PINK_BORDER}`,
              boxShadow:   isDragging ? `0 0 40px ${PINK_GLOW}` : 'none',
              cursor:      file ? 'default' : 'pointer',
              minHeight:   '230px',
            }}
          >
            {/* Radial background glow */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(247,37,133,0.06) 0%, transparent 70%)',
                opacity: isDragging ? 1 : 0.6,
              }}
            />
            {/* Top shimmer line */}
            <div
              className="absolute inset-x-0 top-0 h-px pointer-events-none"
              style={{ background: `linear-gradient(90deg, transparent, ${PINK}55, transparent)` }}
            />

            <input
              id="csv-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />

            {!file ? (
              /* ── Empty state ── */
              <div className="flex flex-col items-center justify-center text-center p-12 relative z-10">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5"
                  style={{ background: PINK_DIM, border: `1px solid ${PINK_BORDER}` }}
                >
                  📂
                </div>
                <p className="text-white font-semibold text-lg">Arraste seu arquivo CSV aqui</p>
                <p className="text-slate-500 text-sm mt-1">ou clique para selecionar</p>
              </div>
            ) : (
              /* ── File loaded state ── */
              <div className="p-6 relative z-10">
                {/* File pill */}
                <div
                  className="flex items-center gap-4 p-4 rounded-xl mb-4"
                  style={{ background: PINK_DIM, border: `1px solid ${PINK_BORDER}` }}
                >
                  <span className="text-2xl">📄</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold truncate">{file.name}</p>
                    <p className="text-slate-400 text-sm">
                      <span style={{ color: PINK }}>{parsed?.rows.length ?? 0} cards</span>
                      {' '}prontos para importar
                      {parsed && parsed.errors.length > 0 && (
                        <span className="text-orange-400 ml-2">· {parsed.errors.length} avisos</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); reset(); }}
                    className="text-slate-500 hover:text-white transition-colors text-lg shrink-0"
                  >
                    ✕
                  </button>
                </div>

                {/* Parse warnings */}
                {parsed && parsed.errors.length > 0 && (
                  <div
                    className="p-3 rounded-xl mb-4 text-xs text-orange-300"
                    style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)' }}
                  >
                    {parsed.errors.slice(0, 5).map((err, i) => <p key={i}>⚠ {err}</p>)}
                    {parsed.errors.length > 5 && (
                      <p className="text-slate-500 mt-1">…e mais {parsed.errors.length - 5} avisos</p>
                    )}
                  </div>
                )}

                {/* Import button */}
                <button
                  onClick={e => { e.stopPropagation(); onImport(); }}
                  disabled={!parsed || parsed.rows.length === 0}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-base transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-40"
                  style={{
                    background: `linear-gradient(135deg, ${PINK}cc, #7928ca)`,
                    boxShadow:  `0 0 24px ${PINK_GLOW}, 0 4px 12px rgba(0,0,0,0.4)`,
                  }}
                >
                  Importar {parsed?.rows.length} cards →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Progress ────────────────────────────────────────────────── */}
        {importing && (
          <div
            className="rounded-2xl p-8"
            style={{
              background:  'rgba(255,255,255,0.03)',
              border:      `1px solid ${PINK_BORDER}`,
              boxShadow:   `0 0 40px ${PINK_GLOW}`,
            }}
          >
            {/* Top shimmer */}
            <div
              className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
              style={{ background: `linear-gradient(90deg, transparent, ${PINK}77, transparent)` }}
            />

            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: PINK, borderTopColor: 'transparent' }}
              />
              <p className="text-white font-semibold">{progressMsg}</p>
            </div>

            {/* Bar */}
            <div className="w-full h-3 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width:      `${progress}%`,
                  background: `linear-gradient(90deg, ${PINK}, #7928ca)`,
                  boxShadow:  `0 0 14px rgba(247,37,133,0.6)`,
                }}
              />
            </div>
            <p className="text-right text-slate-500 text-sm font-semibold">{progress}%</p>
          </div>
        )}

        {/* ── Result ──────────────────────────────────────────────────── */}
        {result && (
          <div
            className="rounded-2xl p-8"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border:     '1px solid rgba(0,255,128,0.3)',
              boxShadow:  '0 0 40px rgba(0,255,128,0.08)',
            }}
          >
            {/* Top shimmer */}
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
                { label: 'Cards inseridos',   value: result.cardsInserted,   color: '#00ff80' },
                { label: 'Matérias criadas',  value: result.subjectsCreated, color: '#00e5ff' },
                { label: 'Decks criados',     value: result.decksCreated,    color: PINK      },
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
                style={{ color: PINK, background: PINK_DIM, border: `1px solid ${PINK_BORDER}` }}
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
