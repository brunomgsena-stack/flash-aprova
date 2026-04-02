'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  Users,
  AlertTriangle,
  BookOpen,
  GraduationCap,
  Brain,
  ChevronRight,
  ArrowLeft,
  FileText,
  Moon,
  X,
  Printer,
  Flame,
  Activity,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface School {
  name: string;
  logo_url?: string;
  primary_color: string;
}

export interface Student {
  id: string;
  name: string;
  retention: number;       // 0-100
  engagement: number;      // 0-100
  study_hours: number[];   // hora do dia (0-23) de cada sessão recente
  forgetting_curve: { day: string; retention: number }[];
}

export interface ClassRoom {
  id: string;
  name: string;
  student_count: number;
  retention_avg: number;
  radar: { area: string; value: number }[];
  students: Student[];
}

export interface CriticalSubject {
  name: string;
  retention: number; // 0-100
}

export interface DirectorDashboardData {
  school: School;
  engagement_pct: number;
  memory_score: number;
  students_at_risk: number;
  top_subject?: string;
  critical_subject?: string;
  radar: { area: string; value: number }[];
  classes: ClassRoom[];
  critical_subjects: CriticalSubject[];
}

// ── Mock Data ──────────────────────────────────────────────────────────────────

const MOCK_DATA: DirectorDashboardData = {
  school: { name: 'Colégio Panteão', logo_url: '/logos/panteao.png', primary_color: '#10b981' },
  engagement_pct:   87,
  memory_score:     74,
  students_at_risk: 12,
  top_subject:      'Biologia (Citologia)',
  critical_subject: 'História (Brasil Colônia)',
  radar: [
    { area: 'Natureza',   value: 79 },
    { area: 'Humanas',    value: 61 },
    { area: 'Linguagens', value: 83 },
    { area: 'Matemática', value: 66 },
  ],
  critical_subjects: [
    { name: 'Estequiometria',              retention: 22 },
    { name: 'Brasil Colônia',              retention: 31 },
    { name: 'Funções do 2º Grau',          retention: 38 },
    { name: 'Geopolítica Mundial',         retention: 44 },
    { name: 'Genética Mendeliana',         retention: 49 },
  ],
  classes: [
    {
      id: '1',
      name: '3º Ano A',
      student_count: 45,
      retention_avg: 82,
      radar: [
        { area: 'Natureza',   value: 85 },
        { area: 'Humanas',    value: 70 },
        { area: 'Linguagens', value: 88 },
        { area: 'Matemática', value: 75 },
      ],
      students: [
        {
          id: 's1',
          name: 'Ana Beatriz Costa',
          retention: 91,
          engagement: 95,
          study_hours: [14, 15, 16, 19, 20, 21, 14, 15],
          forgetting_curve: [
            { day: 'Seg', retention: 98 }, { day: 'Ter', retention: 88 },
            { day: 'Qua', retention: 79 }, { day: 'Qui', retention: 85 },
            { day: 'Sex', retention: 90 }, { day: 'Sáb', retention: 93 },
            { day: 'Dom', retention: 91 },
          ],
        },
        {
          id: 's2',
          name: 'Carlos Eduardo Lima',
          retention: 73,
          engagement: 68,
          study_hours: [22, 23, 0, 1, 2, 23, 0, 22, 1],
          forgetting_curve: [
            { day: 'Seg', retention: 80 }, { day: 'Ter', retention: 70 },
            { day: 'Qua', retention: 55 }, { day: 'Qui', retention: 60 },
            { day: 'Sex', retention: 52 }, { day: 'Sáb', retention: 65 },
            { day: 'Dom', retention: 73 },
          ],
        },
        {
          id: 's3',
          name: 'Fernanda Oliveira',
          retention: 38,
          engagement: 42,
          study_hours: [23, 0, 1, 2, 3, 23, 0, 1, 2],
          forgetting_curve: [
            { day: 'Seg', retention: 65 }, { day: 'Ter', retention: 55 },
            { day: 'Qua', retention: 40 }, { day: 'Qui', retention: 30 },
            { day: 'Sex', retention: 25 }, { day: 'Sáb', retention: 32 },
            { day: 'Dom', retention: 38 },
          ],
        },
        {
          id: 's4',
          name: 'Rafael Santos Melo',
          retention: 85,
          engagement: 88,
          study_hours: [8, 9, 14, 15, 16, 20, 8, 14],
          forgetting_curve: [
            { day: 'Seg', retention: 90 }, { day: 'Ter', retention: 85 },
            { day: 'Qua', retention: 82 }, { day: 'Qui', retention: 88 },
            { day: 'Sex', retention: 86 }, { day: 'Sáb', retention: 87 },
            { day: 'Dom', retention: 85 },
          ],
        },
      ],
    },
    {
      id: '2',
      name: '3º Ano B',
      student_count: 42,
      retention_avg: 68,
      radar: [
        { area: 'Natureza',   value: 72 },
        { area: 'Humanas',    value: 55 },
        { area: 'Linguagens', value: 78 },
        { area: 'Matemática', value: 58 },
      ],
      students: [
        {
          id: 's5',
          name: 'Julia Mendes Rocha',
          retention: 79,
          engagement: 82,
          study_hours: [16, 17, 18, 20, 21, 16, 17],
          forgetting_curve: [
            { day: 'Seg', retention: 85 }, { day: 'Ter', retention: 80 },
            { day: 'Qua', retention: 75 }, { day: 'Qui', retention: 78 },
            { day: 'Sex', retention: 80 }, { day: 'Sáb', retention: 82 },
            { day: 'Dom', retention: 79 },
          ],
        },
        {
          id: 's6',
          name: 'Thiago Carvalho',
          retention: 45,
          engagement: 38,
          study_hours: [23, 0, 1, 2, 23, 0, 1, 3],
          forgetting_curve: [
            { day: 'Seg', retention: 60 }, { day: 'Ter', retention: 50 },
            { day: 'Qua', retention: 38 }, { day: 'Qui', retention: 35 },
            { day: 'Sex', retention: 28 }, { day: 'Sáb', retention: 38 },
            { day: 'Dom', retention: 45 },
          ],
        },
        {
          id: 's7',
          name: 'Isabela Ferreira',
          retention: 62,
          engagement: 70,
          study_hours: [19, 20, 21, 22, 19, 20, 21],
          forgetting_curve: [
            { day: 'Seg', retention: 70 }, { day: 'Ter', retention: 65 },
            { day: 'Qua', retention: 60 }, { day: 'Qui', retention: 63 },
            { day: 'Sex', retention: 65 }, { day: 'Sáb', retention: 64 },
            { day: 'Dom', retention: 62 },
          ],
        },
      ],
    },
  ],
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function fadeUp(delay = 0) {
  return {
    initial:    { opacity: 0, y: 24 },
    animate:    { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
  };
}

function detectBurnout(student: Student): 'burnout' | 'nocturnal' | null {
  const nightHours = new Set([23, 0, 1, 2, 3, 4]);
  const nightSessions = student.study_hours.filter(h => nightHours.has(h)).length;
  if (nightSessions < 3) return null;
  const curve   = student.forgetting_curve;
  const hasDropOff = curve.length >= 3 &&
    curve[curve.length - 1].retention - curve[0].retention < -20;
  if (student.retention < 50 || hasDropOff) return 'burnout';
  return 'nocturnal';
}

function retentionColor(v: number) {
  if (v >= 70) return '#00FF73';
  if (v >= 50) return '#f59e0b';
  return '#ef4444';
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background:           'rgba(255,255,255,0.04)',
  backdropFilter:       'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border:               '1px solid rgba(255,255,255,0.08)',
  borderRadius:         '1rem',
};

// ── CircleProgress ─────────────────────────────────────────────────────────────

function CircleProgress({ value, color, size = 80 }: { value: number; color: string; size?: number }) {
  const strokeW = 5;
  const r       = (size - strokeW * 2) / 2;
  const circ    = 2 * Math.PI * r;
  const offset  = circ - (value / 100) * circ;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeW} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-bold"
        style={{ fontSize: size * 0.22, color: '#fff' }}
      >
        {value}%
      </span>
    </div>
  );
}

// ── Radar Tooltip ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makeRadarTooltip(primaryRgb: string): React.FC<any> {
  return function RadarTooltip({ active, payload }: { active?: boolean; payload?: readonly { value: number }[] }) {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: 'rgba(12,12,20,0.95)', border: `1px solid rgba(${primaryRgb},0.35)`,
        borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#fff',
      }}>
        {payload[0].value}% de desempenho
      </div>
    );
  };
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.95 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: 32, scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => setTimeout(onDone, 2800)}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
                 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-2xl"
      style={{
        background:  'rgba(16,185,129,0.15)',
        border:      '1px solid rgba(16,185,129,0.45)',
        backdropFilter: 'blur(16px)',
        boxShadow:   '0 0 28px rgba(16,185,129,0.25)',
      }}
    >
      <FileText className="w-4 h-4" style={{ color: '#10b981' }} />
      {message}
    </motion.div>
  );
}

// ── ReportModal ───────────────────────────────────────────────────────────────

function ReportModal({
  student,
  school,
  onClose,
}: {
  student: Student;
  school: School;
  onClose: () => void;
}) {
  const burnout = detectBurnout(student);
  const statusLabel =
    burnout === 'burnout'   ? '⚠️ Alerta de Burnout'   :
    burnout === 'nocturnal' ? '🌙 Estudo Noturno'       :
    student.retention >= 75 ? '✅ Desempenho Excelente' :
                              '⚡ Em Desenvolvimento';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{    opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1,    y: 0   }}
        exit={{    opacity: 0, scale: 0.92, y: 24  }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: '#0f1520', border: '1px solid rgba(16,185,129,0.3)', boxShadow: '0 0 60px rgba(16,185,129,0.15)' }}
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: `rgba(${hexToRgb(school.primary_color)},0.07)` }}
        >
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5" style={{ color: school.primary_color }} />
            <div>
              <p className="text-xs text-white/40 tracking-widest uppercase">Relatório Pedagógico</p>
              <p className="text-sm font-bold text-white">{school.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: school.primary_color, border: `1px solid rgba(${hexToRgb(school.primary_color)},0.35)` }}
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Student info */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Aluno(a)</p>
              <h2 className="text-xl font-black text-white">{student.name}</h2>
              <p className="text-xs text-white/40 mt-0.5">Ano Letivo 2026 · {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0"
              style={
                burnout === 'burnout' ? { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444' } :
                burnout === 'nocturnal' ? { background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.35)', color: '#818cf8' } :
                { background: 'rgba(0,255,115,0.10)', border: '1px solid rgba(0,255,115,0.3)', color: '#00FF73' }
              }
            >
              {statusLabel}
            </span>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Retenção',     value: `${student.retention}%`,   color: retentionColor(student.retention) },
              { label: 'Engajamento',  value: `${student.engagement}%`,  color: '#00e5ff' },
              { label: 'Sessões Noturnas', value: `${student.study_hours.filter(h => new Set([23,0,1,2,3,4]).has(h)).length}`, color: '#818cf8' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <p className="text-lg font-black" style={{ color }}>{value}</p>
                <p className="text-[10px] text-white/35 mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Curva de retenção mini */}
          <div style={{ height: 110 }}>
            <p className="text-[10px] text-white/35 uppercase tracking-widest mb-2">Curva de Retenção — 7 dias</p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={student.forgetting_curve} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Line
                  type="monotone" dataKey="retention" strokeWidth={2}
                  stroke={retentionColor(student.retention)}
                  dot={{ r: 3, fill: retentionColor(student.retention), strokeWidth: 0 }}
                  style={{ filter: `drop-shadow(0 0 4px ${retentionColor(student.retention)})` }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Recommendations */}
          <div className="rounded-xl p-4 space-y-1.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] text-white/35 uppercase tracking-widest mb-2">Recomendações Pedagógicas</p>
            {burnout === 'burnout' && (
              <p className="text-xs text-white/70">🔴 Reduzir carga de estudo noturno e agendar conversa com orientador.</p>
            )}
            {burnout === 'nocturnal' && (
              <p className="text-xs text-white/70">🟡 Encorajar horários diurnos de estudo para melhor consolidação da memória.</p>
            )}
            {student.retention < 60 && (
              <p className="text-xs text-white/70">🟠 Aumentar frequência de revisões espaçadas nos tópicos críticos.</p>
            )}
            {student.retention >= 75 && (
              <p className="text-xs text-white/70">🟢 Manter ritmo atual. Considerar desafios de aprofundamento.</p>
            )}
            <p className="text-xs text-white/70">📅 Próxima revisão recomendada: {new Date(Date.now() + 86400000 * 2).toLocaleDateString('pt-BR')}.</p>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 text-center"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}
        >
          <p className="text-[10px] text-white/20">Gerado por FlashAprova B2B · Dados confidenciais</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── GapAnalysis ───────────────────────────────────────────────────────────────

function GapAnalysis({ subjects, delay = 0 }: { subjects: CriticalSubject[]; delay?: number }) {
  return (
    <motion.div {...fadeUp(delay)} style={CARD} className="relative overflow-hidden p-6">
      {/* Glow overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top left, rgba(239,68,68,0.08) 0%, transparent 65%)' }} />
      <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.4), transparent)' }} />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-4 h-4" style={{ color: '#ef4444', filter: 'drop-shadow(0 0 4px #ef4444)' }} />
          <p className="text-sm font-semibold text-white">Zona de Intervenção Imediata</p>
        </div>
        <p className="text-xs text-white/40 mb-5 pl-6">Top 5 assuntos com menor retenção — requerem ação pedagógica</p>

        <div className="space-y-3">
          {subjects.map((subj, i) => (
            <motion.div
              key={subj.name}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.1 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-white/80">{subj.name}</span>
                <span
                  className="text-xs font-black tabular-nums"
                  style={{ color: subj.retention < 35 ? '#ef4444' : '#f59e0b' }}
                >
                  {subj.retention}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${subj.retention}%` }}
                  transition={{ delay: delay + 0.15 + i * 0.06, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    background: subj.retention < 35
                      ? 'linear-gradient(90deg, #ef4444, #f97316)'
                      : 'linear-gradient(90deg, #f97316, #eab308)',
                    boxShadow: subj.retention < 35
                      ? '0 0 8px rgba(239,68,68,0.6)'
                      : '0 0 8px rgba(245,158,11,0.5)',
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── ForgettingCurveChart ──────────────────────────────────────────────────────

function ForgettingCurveChart({ student, primaryColor }: { student: Student; primaryColor: string }) {
  const color = retentionColor(student.retention);
  return (
    <div>
      <p className="text-[10px] text-white/35 uppercase tracking-widest mb-3">Curva de Esquecimento — 7 dias</p>
      <div style={{ height: 150 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={student.forgetting_curve} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                background: 'rgba(12,12,20,0.95)', border: `1px solid ${color}44`,
                borderRadius: 8, fontSize: 12, color: '#fff',
              }}
              formatter={(v) => [`${v}%`, 'Retenção']}
            />
            <Line
              type="monotone" dataKey="retention" strokeWidth={2.5} stroke={color}
              dot={{ r: 4, fill: color, strokeWidth: 0, filter: `drop-shadow(0 0 4px ${color})` }}
              activeDot={{ r: 6, fill: color }}
              style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── BurnoutBadge ──────────────────────────────────────────────────────────────

function BurnoutBadge({ type }: { type: 'burnout' | 'nocturnal' }) {
  const isBurnout = type === 'burnout';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{
        opacity: 1, scale: 1,
        boxShadow: isBurnout
          ? ['0 0 0px rgba(239,68,68,0)', '0 0 20px rgba(239,68,68,0.4)', '0 0 0px rgba(239,68,68,0)']
          : ['0 0 0px rgba(99,102,241,0)', '0 0 16px rgba(99,102,241,0.35)', '0 0 0px rgba(99,102,241,0)'],
      }}
      transition={{
        opacity:   { duration: 0.45 },
        scale:     { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
        boxShadow: { duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 },
      }}
      className="flex items-center gap-2 rounded-xl px-4 py-2.5"
      style={isBurnout ? {
        background: 'rgba(239,68,68,0.1)',
        border:     '1px solid rgba(239,68,68,0.35)',
      } : {
        background: 'rgba(99,102,241,0.1)',
        border:     '1px solid rgba(99,102,241,0.35)',
      }}
    >
      {isBurnout
        ? <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#ef4444' }} />
        : <Moon className="w-4 h-4 flex-shrink-0" style={{ color: '#818cf8' }} />
      }
      <div>
        <p className="text-xs font-bold" style={{ color: isBurnout ? '#ef4444' : '#818cf8' }}>
          {isBurnout ? '⚠️ Alerta de Burnout' : '🌙 Estudo Noturno Irregular'}
        </p>
        <p className="text-[10px] text-white/40 mt-0.5">
          {isBurnout
            ? 'Queda de performance + sessões tardias detectadas'
            : 'Maioria das sessões entre 23h–4h'}
        </p>
      </div>
    </motion.div>
  );
}

// ── DirectorDashboard ─────────────────────────────────────────────────────────

type ViewState = 'escola' | 'turma' | 'aluno';

export default function DirectorDashboard({ data = MOCK_DATA }: { data?: DirectorDashboardData }) {
  const { school, engagement_pct, memory_score, students_at_risk, top_subject, critical_subject, radar, classes, critical_subjects } = data;
  const primaryRgb = hexToRgb(school.primary_color);

  const [view,            setView           ] = useState<ViewState>('escola');
  const [selectedClass,   setSelectedClass  ] = useState<ClassRoom | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [reportModal,     setReportModal    ] = useState(false);
  const [toast,           setToast          ] = useState(false);

  const goToClass = useCallback((cls: ClassRoom) => {
    setSelectedClass(cls);
    setSelectedStudent(null);
    setView('turma');
  }, []);

  const goToStudent = useCallback((student: Student) => {
    setSelectedStudent(student);
    setView('aluno');
  }, []);

  const goBack = useCallback(() => {
    if (view === 'aluno') { setView('turma'); setSelectedStudent(null); }
    else                  { setView('escola'); setSelectedClass(null); setSelectedStudent(null); }
  }, [view]);

  function handleGenerateReport() {
    setToast(true);
    setTimeout(() => setReportModal(true), 600);
  }

  const RadarTooltip = makeRadarTooltip(primaryRgb);

  // Determine which radar data to show
  const activeRadar  = selectedClass ? selectedClass.radar : radar;
  const activeLabel  = selectedClass ? `Desempenho por Área — ${selectedClass.name}` : 'Desempenho por Área — ENEM';

  return (
    <div className="min-h-screen w-full p-4 md:p-8" style={{ background: '#0c0c14' }}>

      {/* Grid overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(${primaryRgb},0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(${primaryRgb},0.04) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }} />

      <div className="relative z-10 max-w-6xl mx-auto space-y-6">

        {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
        <motion.header
          {...fadeUp(0)}
          className="flex flex-wrap items-center gap-4 pb-5"
          style={{ borderBottom: `1px solid rgba(${primaryRgb},0.2)` }}
        >
          {/* Back button */}
          <AnimatePresence>
            {view !== 'escola' && (
              <motion.button
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{    opacity: 0, x: -12 }}
                onClick={goBack}
                className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 transition-colors hover:bg-white/10"
                style={{ border: `1px solid rgba(${primaryRgb},0.3)` }}
              >
                <ArrowLeft className="w-4 h-4 text-white/70" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* School icon */}
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
            style={{
              background: `rgba(${primaryRgb},0.12)`,
              border:     `1.5px solid rgba(${primaryRgb},0.45)`,
              boxShadow:  `0 0 20px rgba(${primaryRgb},0.2)`,
            }}
          >
            {school.logo_url
              ? <img src={school.logo_url} alt={school.name} className="w-7 h-7 object-contain" /> // eslint-disable-line @next/next/no-img-element
              : <GraduationCap className="w-6 h-6" style={{ color: school.primary_color }} />
            }
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: `rgba(${primaryRgb},0.7)` }}>
              Painel do Diretor Pedagógico
            </p>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-lg md:text-xl font-bold text-white leading-tight">{school.name}</h1>
              {selectedClass && (
                <>
                  <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
                  <span className="text-lg font-bold leading-tight" style={{ color: school.primary_color }}>
                    {selectedClass.name}
                  </span>
                </>
              )}
              {selectedStudent && (
                <>
                  <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
                  <span className="text-lg font-bold leading-tight text-white/80">
                    {selectedStudent.name}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="ml-auto hidden sm:block flex-shrink-0">
            <span
              className="text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{
                background: `rgba(${primaryRgb},0.1)`,
                border:     `1px solid rgba(${primaryRgb},0.3)`,
                color:      school.primary_color,
              }}
            >
              Ano Letivo 2026
            </span>
          </div>
        </motion.header>

        {/* ══ VIEW: ESCOLA ════════════════════════════════════════════════════ */}
        <AnimatePresence mode="wait">
          {view === 'escola' && (
            <motion.div
              key="escola"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Engajamento */}
                <motion.div {...fadeUp(0.08)} style={CARD} className="relative overflow-hidden p-5 flex items-center gap-4">
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top left, rgba(0,229,255,0.08) 0%, transparent 65%)' }} />
                  <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.3), transparent)' }} />
                  <CircleProgress value={engagement_pct} color="#00e5ff" size={72} />
                  <div className="relative">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Engajamento</p>
                    <p className="text-base font-bold text-white">Alunos Ativos</p>
                    <p className="text-xs text-white/45 mt-0.5">na última semana</p>
                  </div>
                </motion.div>

                {/* Retenção */}
                <motion.div {...fadeUp(0.15)} style={CARD} className="relative overflow-hidden p-5 flex items-center gap-4">
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top left, rgba(0,255,115,0.08) 0%, transparent 65%)' }} />
                  <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,115,0.3), transparent)' }} />
                  <CircleProgress value={memory_score} color="#00FF73" size={72} />
                  <div className="relative">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Retenção</p>
                    <p className="text-base font-bold text-white">Score de Memória</p>
                    <p className="text-xs text-white/45 mt-0.5">média de acertos</p>
                  </div>
                </motion.div>

                {/* Alerta risco */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{
                    opacity: 1, y: 0,
                    boxShadow: ['0 0 0px rgba(245,158,11,0)', '0 0 22px rgba(245,158,11,0.35)', '0 0 0px rgba(245,158,11,0)'],
                  }}
                  transition={{
                    opacity:   { duration: 0.55, delay: 0.22, ease: [0.22, 1, 0.36, 1] },
                    y:         { duration: 0.55, delay: 0.22, ease: [0.22, 1, 0.36, 1] },
                    boxShadow: { duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 },
                  }}
                  style={{ ...CARD, border: '1px solid rgba(245,158,11,0.45)' }}
                  className="relative overflow-hidden p-5 flex items-center gap-4"
                >
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top left, rgba(245,158,11,0.09) 0%, transparent 65%)' }} />
                  <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.4), transparent)' }} />
                  <div className="relative flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                    <AlertTriangle className="w-7 h-7" style={{ color: '#f59e0b' }} />
                  </div>
                  <div className="relative">
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Alerta de Risco</p>
                    <p className="text-3xl font-black leading-none" style={{ color: '#f59e0b' }}>{students_at_risk}</p>
                    <p className="text-xs text-white/45 mt-1">alunos sem revisão há 7d</p>
                  </div>
                </motion.div>
              </div>

              {/* Radar + Classes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Radar */}
                <motion.div {...fadeUp(0.3)} style={CARD} className="relative overflow-hidden p-6">
                  <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at top left, rgba(${primaryRgb},0.08) 0%, transparent 65%)` }} />
                  <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, rgba(${primaryRgb},0.4), transparent)` }} />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4" style={{ color: school.primary_color }} />
                      <p className="text-sm font-semibold text-white">{activeLabel}</p>
                    </div>
                    <p className="text-xs text-white/40 mb-4 pl-6">Média da escola nas 4 grandes áreas</p>
                    <div style={{ height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={activeRadar} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                          <PolarGrid stroke="rgba(255,255,255,0.07)" />
                          <PolarAngleAxis dataKey="area" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 600 }} />
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          <Tooltip content={RadarTooltip as any} />
                          <Radar dataKey="value" stroke={school.primary_color} fill={school.primary_color} fillOpacity={0.15} strokeWidth={2}
                            dot={{ r: 4, fill: school.primary_color, strokeWidth: 0, filter: `drop-shadow(0 0 4px ${school.primary_color})` }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>

                {/* Classes table — clicável */}
                <motion.div {...fadeUp(0.38)} style={CARD} className="relative overflow-hidden p-6">
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top right, rgba(0,255,128,0.06) 0%, transparent 65%)' }} />
                  <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,128,0.3), transparent)' }} />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <p className="text-sm font-semibold text-white">Performance por Turma</p>
                    </div>
                    <p className="text-xs text-white/40 mb-4 pl-6">Clique em uma turma para ver detalhes</p>
                    <div className="space-y-4">
                      {classes.map((cls, i) => {
                        const isHigh = cls.retention_avg >= 75;
                        return (
                          <motion.button
                            key={cls.id}
                            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.45 + i * 0.07, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                            onClick={() => goToClass(cls)}
                            className="w-full text-left group"
                            whileHover={{ x: 4 }}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm font-medium text-white truncate group-hover:text-emerald-300 transition-colors">
                                  {cls.name}
                                </span>
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                                  style={isHigh ? {
                                    background: 'rgba(0,255,115,0.1)', border: '1px solid rgba(0,255,115,0.3)', color: '#00FF73',
                                  } : {
                                    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b',
                                  }}
                                >
                                  {isHigh ? 'Alta Performance' : 'Atenção'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs flex-shrink-0 ml-2">
                                <span className="text-white/35">{cls.student_count} alunos</span>
                                <span className="font-bold tabular-nums" style={{ color: isHigh ? '#00FF73' : '#f59e0b' }}>
                                  {cls.retention_avg}%
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
                              </div>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                              <motion.div
                                className="h-full rounded-full"
                                initial={{ width: 0 }} animate={{ width: `${cls.retention_avg}%` }}
                                transition={{ delay: 0.5 + i * 0.07, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                                style={{
                                  background: isHigh ? 'linear-gradient(90deg, #00FF73, #00e5ff)' : 'linear-gradient(90deg, #f59e0b, #f97316)',
                                  boxShadow:  isHigh ? '0 0 8px rgba(0,255,115,0.55)' : '0 0 8px rgba(245,158,11,0.55)',
                                }}
                              />
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Gap Analysis */}
              <GapAnalysis subjects={critical_subjects} delay={0.48} />

              {/* Destaque de matérias */}
              {(top_subject || critical_subject) && (
                <motion.div {...fadeUp(0.58)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {top_subject && (
                    <div className="flex items-center gap-3 rounded-xl px-4 py-3"
                      style={{ background: 'rgba(0,255,115,0.05)', border: '1px solid rgba(0,255,115,0.2)' }}>
                      <Brain className="w-4 h-4 flex-shrink-0" style={{ color: '#00FF73' }} />
                      <div>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Destaque da semana</p>
                        <p className="text-sm font-semibold text-white">{top_subject}</p>
                      </div>
                    </div>
                  )}
                  {critical_subject && (
                    <div className="flex items-center gap-3 rounded-xl px-4 py-3"
                      style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: '#f59e0b' }} />
                      <div>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Precisa de atenção</p>
                        <p className="text-sm font-semibold text-white">{critical_subject}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ══ VIEW: TURMA ═════════════════════════════════════════════════════ */}
          {view === 'turma' && selectedClass && (
            <motion.div
              key="turma"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Class mini-stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <motion.div {...fadeUp(0.05)} style={CARD} className="relative overflow-hidden p-5 flex items-center gap-4">
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top left, rgba(0,255,115,0.08) 0%, transparent 65%)' }} />
                  <CircleProgress value={selectedClass.retention_avg} color="#00FF73" size={64} />
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Retenção Média</p>
                    <p className="text-sm font-bold text-white">da Turma</p>
                  </div>
                </motion.div>
                <motion.div {...fadeUp(0.10)} style={CARD} className="p-5 flex items-center gap-4">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)' }}>
                    <Users className="w-6 h-6" style={{ color: '#00e5ff' }} />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Total</p>
                    <p className="text-2xl font-black text-white">{selectedClass.student_count}</p>
                    <p className="text-xs text-white/40">alunos</p>
                  </div>
                </motion.div>
                <motion.div {...fadeUp(0.15)} style={CARD} className="p-5 flex items-center gap-4 col-span-2 sm:col-span-1">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <Activity className="w-6 h-6" style={{ color: '#ef4444' }} />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Em Risco</p>
                    <p className="text-2xl font-black" style={{ color: '#ef4444' }}>
                      {selectedClass.students.filter(s => s.retention < 50).length}
                    </p>
                    <p className="text-xs text-white/40">alunos abaixo de 50%</p>
                  </div>
                </motion.div>
              </div>

              {/* Radar + Student list */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Radar da turma */}
                <motion.div {...fadeUp(0.22)} style={CARD} className="relative overflow-hidden p-6">
                  <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at top left, rgba(${primaryRgb},0.08) 0%, transparent 65%)` }} />
                  <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, rgba(${primaryRgb},0.4), transparent)` }} />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4" style={{ color: school.primary_color }} />
                      <p className="text-sm font-semibold text-white">Desempenho — {selectedClass.name}</p>
                    </div>
                    <p className="text-xs text-white/40 mb-4 pl-6">Média da turma nas 4 grandes áreas</p>
                    <div style={{ height: 220 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={selectedClass.radar} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                          <PolarGrid stroke="rgba(255,255,255,0.07)" />
                          <PolarAngleAxis dataKey="area" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 600 }} />
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          <Tooltip content={RadarTooltip as any} />
                          <Radar dataKey="value" stroke={school.primary_color} fill={school.primary_color} fillOpacity={0.15} strokeWidth={2}
                            dot={{ r: 4, fill: school.primary_color, strokeWidth: 0, filter: `drop-shadow(0 0 4px ${school.primary_color})` }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>

                {/* Alunos da turma */}
                <motion.div {...fadeUp(0.30)} style={CARD} className="relative overflow-hidden p-6">
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top right, rgba(0,229,255,0.06) 0%, transparent 65%)' }} />
                  <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.3), transparent)' }} />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4" style={{ color: '#00e5ff' }} />
                      <p className="text-sm font-semibold text-white">Alunos — {selectedClass.name}</p>
                    </div>
                    <p className="text-xs text-white/40 mb-4 pl-6">Clique em um aluno para ver o dossiê</p>
                    <div className="space-y-3">
                      {selectedClass.students.map((student, i) => {
                        const burnout = detectBurnout(student);
                        const color   = retentionColor(student.retention);
                        return (
                          <motion.button
                            key={student.id}
                            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 + i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            onClick={() => goToStudent(student)}
                            className="w-full text-left group rounded-xl px-3 py-2.5 transition-colors"
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)', x: 3 }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                                  style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
                                  {student.name.charAt(0)}
                                </div>
                                <span className="text-sm font-medium text-white truncate group-hover:text-white transition-colors">
                                  {student.name}
                                </span>
                                {burnout && (
                                  <span className="text-xs flex-shrink-0">
                                    {burnout === 'burnout' ? '⚠️' : '🌙'}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <span className="text-xs font-bold tabular-nums" style={{ color }}>{student.retention}%</span>
                                <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Gap Analysis (escola) */}
              <GapAnalysis subjects={critical_subjects} delay={0.42} />
            </motion.div>
          )}

          {/* ══ VIEW: ALUNO (Dossiê) ════════════════════════════════════════════ */}
          {view === 'aluno' && selectedStudent && (
            <motion.div
              key="aluno"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              {/* Student header card */}
              <motion.div {...fadeUp(0.05)} style={CARD} className="relative overflow-hidden p-6">
                <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at top left, rgba(${primaryRgb},0.08) 0%, transparent 65%)` }} />
                <div className="absolute inset-x-0 top-0 h-px pointer-events-none" style={{ background: `linear-gradient(90deg, transparent, rgba(${primaryRgb},0.5), transparent)` }} />
                <div className="relative z-10">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Dossiê do Aluno</p>
                      <h2 className="text-2xl font-black text-white">{selectedStudent.name}</h2>
                      <p className="text-xs text-white/40 mt-1">{selectedClass?.name} · {school.name}</p>
                    </div>
                    {/* Generate report button */}
                    <motion.button
                      onClick={handleGenerateReport}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{  scale: 0.97 }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                      style={{
                        background: `linear-gradient(135deg, rgba(${primaryRgb},0.2), rgba(${primaryRgb},0.08))`,
                        border:     `1.5px solid rgba(${primaryRgb},0.5)`,
                        color:      school.primary_color,
                        boxShadow:  `0 0 20px rgba(${primaryRgb},0.15)`,
                      }}
                    >
                      <FileText className="w-4 h-4" />
                      Gerar Relatório para Pais
                    </motion.button>
                  </div>

                  {/* Metrics row */}
                  <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Retenção',    value: `${selectedStudent.retention}%`,   color: retentionColor(selectedStudent.retention) },
                      { label: 'Engajamento', value: `${selectedStudent.engagement}%`,  color: '#00e5ff' },
                      {
                        label: 'Sessões Noturnas',
                        value: `${selectedStudent.study_hours.filter(h => new Set([23,0,1,2,3,4]).has(h)).length}`,
                        color: '#818cf8',
                      },
                      {
                        label: 'Total de Sessões',
                        value: `${selectedStudent.study_hours.length}`,
                        color: school.primary_color,
                      },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="rounded-xl p-3 text-center"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <p className="text-xl font-black" style={{ color, textShadow: `0 0 12px ${color}80` }}>{value}</p>
                        <p className="text-[10px] text-white/35 mt-0.5 leading-tight">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Forgetting curve */}
              <motion.div {...fadeUp(0.14)} style={CARD} className="relative overflow-hidden p-6">
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at top left, rgba(${hexToRgb(retentionColor(selectedStudent.retention))},0.07) 0%, transparent 65%)` }} />
                <div className="absolute inset-x-0 top-0 h-px pointer-events-none"
                  style={{ background: `linear-gradient(90deg, transparent, rgba(${hexToRgb(retentionColor(selectedStudent.retention))},0.4), transparent)` }} />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-4 h-4" style={{ color: retentionColor(selectedStudent.retention) }} />
                    <p className="text-sm font-semibold text-white">Curva de Esquecimento Individual</p>
                  </div>
                  <p className="text-xs text-white/40 mb-4 pl-6">Evolução da retenção nos últimos 7 dias</p>
                  <ForgettingCurveChart student={selectedStudent} primaryColor={school.primary_color} />
                </div>
              </motion.div>

              {/* Burnout / Wellness indicator */}
              <motion.div {...fadeUp(0.22)} style={CARD} className="relative overflow-hidden p-6">
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at top right, rgba(99,102,241,0.07) 0%, transparent 65%)' }} />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4" style={{ color: '#818cf8' }} />
                    <p className="text-sm font-semibold text-white">Índice de Bem-Estar · Ritmo de Estudo</p>
                  </div>
                  <p className="text-xs text-white/40 mb-4 pl-6">Análise baseada no padrão de horários de estudo</p>

                  {(() => {
                    const burnout = detectBurnout(selectedStudent);
                    if (burnout) {
                      return <BurnoutBadge type={burnout} />;
                    }
                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className="flex items-center gap-3 rounded-xl px-4 py-3"
                        style={{ background: 'rgba(0,255,115,0.07)', border: '1px solid rgba(0,255,115,0.2)' }}
                      >
                        <span className="text-xl">✅</span>
                        <div>
                          <p className="text-sm font-bold" style={{ color: '#00FF73' }}>Ritmo Saudável</p>
                          <p className="text-xs text-white/40 mt-0.5">Horários de estudo dentro do padrão recomendado</p>
                        </div>
                      </motion.div>
                    );
                  })()}

                  {/* Study hours heatmap */}
                  <div className="mt-4">
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Distribuição de Horários</p>
                    <div className="flex items-end gap-1" style={{ height: 40 }}>
                      {Array.from({ length: 24 }, (_, hour) => {
                        const count     = selectedStudent.study_hours.filter(h => h === hour).length;
                        const isNight   = new Set([23, 0, 1, 2, 3, 4]).has(hour);
                        const maxCount  = Math.max(...Array.from({ length: 24 }, (_, h) => selectedStudent.study_hours.filter(sh => sh === h).length), 1);
                        const pct       = count / maxCount;
                        return (
                          <div
                            key={hour}
                            className="flex-1 rounded-sm transition-all"
                            title={`${hour}h: ${count} sessões`}
                            style={{
                              height:     `${Math.max(pct * 100, count > 0 ? 15 : 4)}%`,
                              background: count === 0
                                ? 'rgba(255,255,255,0.05)'
                                : isNight
                                  ? `rgba(99,102,241,${0.3 + pct * 0.7})`
                                  : `rgba(16,185,129,${0.3 + pct * 0.7})`,
                              boxShadow: count > 0 && isNight ? '0 0 4px rgba(99,102,241,0.4)' :
                                         count > 0 ? '0 0 4px rgba(16,185,129,0.4)' : 'none',
                            }}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[9px] text-white/20">0h</span>
                      <span className="text-[9px] text-white/20">12h</span>
                      <span className="text-[9px] text-white/20">23h</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.p {...fadeUp(0.7)} className="text-center text-xs text-white/20 pb-2">
          Dados atualizados em tempo real · FlashAprova B2B
        </motion.p>
      </div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <Toast
            message="Gerando PDF personalizado..."
            onDone={() => setToast(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Report Modal ── */}
      <AnimatePresence>
        {reportModal && selectedStudent && (
          <ReportModal
            student={selectedStudent}
            school={school}
            onClose={() => setReportModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
