'use client';

import { useState } from 'react';

const VIOLET = '#7C3AED';
const CYAN = '#06b6d4';
const RED = '#ef4444';
const MONO = "'JetBrains Mono', 'Courier New', ui-monospace, monospace";

export default function PanelLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin-panel/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.reload();
        return;
      }
      setError('Acesso negado');
    } catch {
      setError('Acesso negado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08040f', padding: 24 }}>
      <form onSubmit={handleSubmit}
        style={{ width: '100%', maxWidth: 380, background: 'rgba(6,3,18,0.84)', border: `1px solid ${VIOLET}50`, borderRadius: 24, padding: 36 }}>
        <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', color: `${CYAN}cc`, marginBottom: 8 }}>
          {'> [ ACESSO RESTRITO ]'}
        </p>
        <h1 style={{ fontFamily: MONO, color: '#fff', fontWeight: 900, fontSize: 22, marginBottom: 20 }}>
          Painel de Leads
        </h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="senha"
          autoComplete="current-password"
          required
          style={{ width: '100%', padding: '14px 16px', borderRadius: 12, background: 'rgba(0,0,0,0.55)',
            border: `1px solid ${VIOLET}40`, color: '#fff', fontFamily: MONO, outline: 'none', marginBottom: 14 }}
        />
        {error && <p style={{ color: RED, fontFamily: MONO, fontSize: 12, marginBottom: 12 }}>{error}</p>}
        <button type="submit" disabled={loading}
          style={{ width: '100%', padding: 16, borderRadius: 12, border: `1.5px solid ${VIOLET}90`,
            background: `linear-gradient(135deg, ${VIOLET}, #5b21b6)`, color: '#fff', fontFamily: MONO,
            fontWeight: 900, letterSpacing: '0.12em', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1 }}>
          {loading ? '[ VERIFICANDO... ]' : '[ ENTRAR ]'}
        </button>
      </form>
    </div>
  );
}
