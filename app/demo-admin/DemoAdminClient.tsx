'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

type DemoSchool = {
  id: string;
  slug: string;
  token: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string | null;
  tutor_name: string;
  slogan: string | null;
  website_url: string | null;
  created_at: string;
};

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function DemoAdminClient() {
  const supabase = createClient();

  const [demos, setDemos]           = useState<DemoSchool[]>([]);
  const [loading, setLoading]       = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [copied, setCopied]         = useState<string | null>(null);

  const [websiteUrl,     setWebsiteUrl]     = useState('');
  const [name,           setName]           = useState('');
  const [logoUrl,        setLogoUrl]        = useState('');
  const [primaryColor,   setPrimaryColor]   = useState('#7C3AED');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [tutorName,      setTutorName]      = useState('Tutor IA');
  const [slogan,         setSlogan]         = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDemos = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('demo_schools')
      .select('*')
      .order('created_at', { ascending: false });
    setDemos(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchDemos(); }, [fetchDemos]);

  async function handleExtract() {
    if (!websiteUrl) return;
    setExtracting(true);
    try {
      const res = await fetch('/api/demo-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl }),
      });
      const data = await res.json();
      if (data.name)          setName(data.name);
      if (data.logo_url)      setLogoUrl(data.logo_url);
      if (data.primary_color) setPrimaryColor(data.primary_color);
    } catch {
      // silencia erros — o vendedor preenche manualmente
    }
    setExtracting(false);
  }

  async function handleCreate() {
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Nome da escola é obrigatório.' });
      return;
    }
    setSaving(true);
    setMessage(null);

    const baseSlug = slugify(name);
    const { data: existing } = await supabase
      .from('demo_schools')
      .select('slug')
      .like('slug', `${baseSlug}%`);

    let slug = baseSlug;
    if (existing && existing.length > 0) {
      slug = `${baseSlug}-${existing.length + 1}`;
    }

    const { error } = await supabase
      .from('demo_schools')
      .insert({
        slug,
        name:            name.trim(),
        logo_url:        logoUrl.trim() || null,
        primary_color:   primaryColor,
        secondary_color: secondaryColor.trim() || null,
        tutor_name:      tutorName.trim() || 'Tutor IA',
        slogan:          slogan.trim() || null,
        website_url:     websiteUrl.trim() || null,
      });

    if (error) {
      setMessage({ type: 'error', text: 'Erro ao criar demo. Tente novamente.' });
      setSaving(false);
      return;
    }

    setWebsiteUrl(''); setName(''); setLogoUrl('');
    setPrimaryColor('#7C3AED'); setSecondaryColor('');
    setTutorName('Tutor IA'); setSlogan('');
    setMessage({ type: 'success', text: 'Demo criado! Copie o link na lista abaixo.' });
    await fetchDemos();
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este demo?')) return;
    await supabase.from('demo_schools').delete().eq('id', id);
    await fetchDemos();
  }

  function demoLink(demo: DemoSchool): string {
    const base = typeof window !== 'undefined' ? window.location.origin : 'https://flashaprova.com.br';
    return `${base}/demo/${demo.slug}?token=${demo.token}`;
  }

  async function handleCopy(demo: DemoSchool) {
    await navigator.clipboard.writeText(demoLink(demo));
    setCopied(demo.id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="min-h-screen bg-[var(--fa-bg)] text-[var(--fa-text)] p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Demos — Prospecção B2B</h1>

      {/* Formulário de criação */}
      <section className="bg-[var(--fa-card)] border border-[var(--fa-border)] rounded-xl p-6 mb-10">
        <h2 className="text-lg font-semibold mb-4">Criar novo demo</h2>

        {message && (
          <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {message.text}
          </div>
        )}

        {/* URL + Extrair */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="https://siteescola.com.br"
            value={websiteUrl}
            onChange={e => setWebsiteUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleExtract()}
            className="flex-1 bg-white/5 border border-[var(--fa-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
          />
          <button
            onClick={handleExtract}
            disabled={extracting || !websiteUrl}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {extracting ? 'Extraindo...' : 'Extrair'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome */}
          <div>
            <label className="text-xs text-[var(--fa-text-2)] mb-1 block">Nome da escola *</label>
            <input
              type="text"
              placeholder="Colégio Elite"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white/5 border border-[var(--fa-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>

          {/* Nome do Tutor */}
          <div>
            <label className="text-xs text-[var(--fa-text-2)] mb-1 block">Nome do Tutor IA</label>
            <input
              type="text"
              placeholder="Elite AI"
              value={tutorName}
              onChange={e => setTutorName(e.target.value)}
              className="w-full bg-white/5 border border-[var(--fa-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>

          {/* Logo URL */}
          <div className="md:col-span-2">
            <label className="text-xs text-[var(--fa-text-2)] mb-1 block">URL da logo</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="https://siteescola.com.br/logo.png"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                className="flex-1 bg-white/5 border border-[var(--fa-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
              {logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="preview"
                  className="h-8 w-8 object-contain rounded flex-shrink-0"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              )}
            </div>
          </div>

          {/* Cor primária */}
          <div>
            <label className="text-xs text-[var(--fa-text-2)] mb-1 block">Cor primária</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className="h-9 w-12 rounded cursor-pointer border border-[var(--fa-border)] bg-transparent"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className="flex-1 bg-white/5 border border-[var(--fa-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Cor secundária */}
          <div>
            <label className="text-xs text-[var(--fa-text-2)] mb-1 block">Cor secundária (opcional)</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={secondaryColor || '#10b981'}
                onChange={e => setSecondaryColor(e.target.value)}
                className="h-9 w-12 rounded cursor-pointer border border-[var(--fa-border)] bg-transparent"
              />
              <input
                type="text"
                placeholder="#10b981"
                value={secondaryColor}
                onChange={e => setSecondaryColor(e.target.value)}
                className="flex-1 bg-white/5 border border-[var(--fa-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
              />
            </div>
          </div>

          {/* Slogan */}
          <div className="md:col-span-2">
            <label className="text-xs text-[var(--fa-text-2)] mb-1 block">Slogan (opcional)</label>
            <input
              type="text"
              placeholder="Preparando campeões desde 1995"
              value={slogan}
              onChange={e => setSlogan(e.target.value)}
              className="w-full bg-white/5 border border-[var(--fa-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={saving || !name.trim()}
          className="mt-6 w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 font-medium text-sm transition-colors"
        >
          {saving ? 'Criando...' : 'Criar Demo'}
        </button>
      </section>

      {/* Lista de demos */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Demos criados</h2>
        {loading ? (
          <p className="text-[var(--fa-text-2)] text-sm">Carregando...</p>
        ) : demos.length === 0 ? (
          <p className="text-[var(--fa-text-2)] text-sm">Nenhum demo criado ainda.</p>
        ) : (
          <div className="space-y-3">
            {demos.map(demo => (
              <div
                key={demo.id}
                className="bg-[var(--fa-card)] border border-[var(--fa-border)] rounded-xl p-4 flex items-center gap-4"
              >
                {demo.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={demo.logo_url}
                    alt={demo.name}
                    className="h-8 w-8 object-contain rounded flex-shrink-0"
                    onError={e => (e.currentTarget.style.display = 'none')}
                  />
                )}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: demo.primary_color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{demo.name}</p>
                  <p className="text-xs text-[var(--fa-text-2)] truncate">{demoLink(demo)}</p>
                </div>
                <button
                  onClick={() => handleCopy(demo)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors flex-shrink-0"
                >
                  {copied === demo.id ? 'Copiado!' : 'Copiar link'}
                </button>
                <button
                  onClick={() => handleDelete(demo.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors flex-shrink-0"
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
