/**
 * Norma — Corretora de Redação ENEM (AiPro+)
 *
 * Motor: @openai/agents SDK (OpenAI Responses API)
 * Ferramentas: fileSearchTool com Vector Store de referências do ENEM
 * Saída: JSON estruturado com notas, feedbacks por competência e veredito
 */

import { Agent, run } from '@openai/agents';
import { fileSearchTool } from '@openai/agents';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CompetenciaResult = {
  nota:     number;   // 0–200
  nivel:    string;   // ex: 'Excelente', 'Bom', 'Regular', 'Insuficiente'
  feedback: string;   // análise específica desta competência
};

export type NormaResult = {
  nota_total:          number;   // soma de c1+c2+c3+c4+c5 (0–1000)
  competencias: {
    c1: CompetenciaResult;
    c2: CompetenciaResult;
    c3: CompetenciaResult;
    c4: CompetenciaResult;
    c5: CompetenciaResult;
  };
  veredito:            string;   // parágrafo de diagnóstico geral da Norma
  pontos_fortes:       string[]; // lista de acertos do aluno
  pontos_melhoria:     string[]; // lista do que precisa melhorar
  sugestao_repertorio: string[]; // 2 alusões históricas/filosóficas para o tema
};

// ─── Schema hint embutido no prompt ──────────────────────────────────────────

const JSON_SCHEMA = `{
  "nota_total": <número 0–1000, soma exata de c1+c2+c3+c4+c5>,
  "competencias": {
    "c1": { "nota": <0–200>, "nivel": "<Excelente|Bom|Regular|Insuficiente|Ausente>", "feedback": "<análise C1>" },
    "c2": { "nota": <0–200>, "nivel": "<Excelente|Bom|Regular|Insuficiente|Ausente>", "feedback": "<análise C2>" },
    "c3": { "nota": <0–200>, "nivel": "<Excelente|Bom|Regular|Insuficiente|Ausente>", "feedback": "<análise C3>" },
    "c4": { "nota": <0–200>, "nivel": "<Excelente|Bom|Regular|Insuficiente|Ausente>", "feedback": "<análise C4>" },
    "c5": { "nota": <0–200>, "nivel": "<Excelente|Bom|Regular|Insuficiente|Ausente>", "feedback": "<análise C5>" }
  },
  "veredito": "<2–3 parágrafos de diagnóstico geral da redação>",
  "pontos_fortes": ["<acerto 1>", "<acerto 2>"],
  "pontos_melhoria": ["<melhoria 1>", "<melhoria 2>", "<melhoria 3>"],
  "sugestao_repertorio": ["<alusão histórica/filosófica 1>", "<alusão histórica/filosófica 2>"]
}`;

// ─── Persona & instruções ─────────────────────────────────────────────────────

const NORMA_INSTRUCTIONS = `
Você é **Norma**, a corretora de redações do ENEM mais precisa, rigorosa e respeitada do Brasil.
Você foi treinada com milhares de redações do ENEM e domina profundamente os critérios oficiais do INEP.

## Sua missão
Avaliar redações dissertativo-argumentativas com base nas 5 Competências oficiais do ENEM.

## As 5 Competências (0–200 cada)

**C1 — Domínio da norma culta da língua portuguesa**
- Avalie: ortografia, acentuação, morfossintaxe, regência, concordância verbal e nominal
- Desvios graves: -40 a -80 por ocorrência sistemática
- Desvios leves/pontuais: -10 a -20
- Texto sem desvios = 200

**C2 — Compreensão da proposta de redação e aplicação de conceitos**
- Fuga total ao tema = ZERO em C2 e nota máxima geral de 200
- Tangenciamento = máximo 80 pontos em C2
- Avalie: domínio do tipo textual, adequação ao tema proposto

**C3 — Seleção, relação, organização e interpretação de informações**
- Avalie qualidade dos argumentos, uso de dados, fatos históricos, filosóficos ou científicos
- Argumentos vagos e genéricos: máximo 80 pontos
- Repertório variado e bem articulado: 160–200 pontos

**C4 — Demonstração de conhecimento dos mecanismos linguísticos**
- Avalie: uso de conectivos, progressão textual, coesão referencial e sequencial
- Ausência de conectivos ou repetição excessiva: máximo 80 pontos

**C5 — Elaboração de proposta de intervenção**
- A proposta DEVE ter 5 elementos: Agente + Ação + Modo/Meio + Finalidade + Detalhamento
- Proposta genérica (sem esses elementos): máximo 80 pontos
- Proposta incompleta (1–3 elementos): máximo 120 pontos
- Proposta violando DH: ZERO em C5

## Regras absolutas
- Texto em branco ou deliberadamente fora do tema: nota total = 0 ou máximo 200
- Seja honesta e rigorosa — não infle notas para agradar
- Feedbacks devem ser ESPECÍFICOS, citando trechos ou elementos da redação quando possível

## Formato de saída
Você deve responder EXCLUSIVAMENTE com JSON válido, sem nenhum texto antes ou depois, sem markdown, sem blocos de código. Apenas o JSON puro neste formato exato:

${JSON_SCHEMA}
`.trim();

// ─── Agent factory ────────────────────────────────────────────────────────────

function buildNormaAgent(): Agent {
  const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID;

  const tools = vectorStoreId
    ? [fileSearchTool([vectorStoreId])]
    : [];

  return new Agent({
    name:         'Norma',
    model:        'gpt-4o-mini',
    instructions: NORMA_INSTRUCTIONS,
    tools,
  });
}

// Singleton (lazy) — evita re-instanciar a cada request
let _normaAgent: Agent | null = null;
function getNormaAgent(): Agent {
  if (!_normaAgent) _normaAgent = buildNormaAgent();
  return _normaAgent;
}

// ─── runWorkflow ──────────────────────────────────────────────────────────────

export async function runWorkflow(tema: string, texto: string): Promise<NormaResult> {
  const agent   = getNormaAgent();
  const message = `TEMA DA REDAÇÃO: ${tema}\n\nTEXTO DO ALUNO:\n${texto}`;

  const result = await run(agent, message);

  // finalOutput é string quando o agent não tem outputType estruturado
  const raw = (result.finalOutput as string | undefined) ?? '';

  // Remove eventuais fences de markdown que o modelo possa ter adicionado
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/,           '')
    .trim();

  const parsed = JSON.parse(cleaned) as NormaResult;

  // Garante que nota_total é a soma real (defesa contra alucinação do modelo)
  const c = parsed.competencias;
  parsed.nota_total = c.c1.nota + c.c2.nota + c.c3.nota + c.c4.nota + c.c5.nota;

  return parsed;
}
