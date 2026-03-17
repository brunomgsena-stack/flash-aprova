export type CardData = { q: string; a: string };
export type SubjectId = 'historia' | 'biologia' | 'quimica' | 'geografia';

export const SUBJECT_META: Record<SubjectId, {
  name: string; icon: string; color: string; area: string;
}> = {
  historia:  { name: 'História',  icon: '⏳', color: '#eab308', area: 'Ciências Humanas' },
  biologia:  { name: 'Biologia',  icon: '🧬', color: '#22c55e', area: 'Ciências da Natureza' },
  quimica:   { name: 'Química',   icon: '⚗️', color: '#06b6d4', area: 'Ciências da Natureza' },
  geografia: { name: 'Geografia', icon: '🌐', color: '#10b981', area: 'Ciências Humanas' },
};

export const CARDS: Record<SubjectId, CardData[]> = {
  historia: [
    { q: 'Em que ano ocorreu a Proclamação da República no Brasil?', a: '1889 — com a participação do Marechal Deodoro da Fonseca, que depôs o Imperador Dom Pedro II.' },
    { q: 'Qual o principal símbolo do início da Revolução Francesa?', a: 'A queda da Bastilha (14/07/1789), fortaleza-prisão que simbolizava o absolutismo de Luís XVI.' },
    { q: 'O que foi o Estado Novo de Getúlio Vargas?', a: 'Regime ditatorial (1937–1945): Vargas fechou o Congresso, suspendeu a Constituição e governou por decreto.' },
    { q: 'O que caracterizou a Guerra Fria (1947–1991)?', a: 'Disputa político-ideológica entre EUA (capitalismo) e URSS (socialismo) sem confronto militar direto.' },
    { q: 'Qual foi a causa imediata da 1ª Guerra Mundial?', a: 'Assassinato do Arquiduque Francisco Fernando (1914), combinado com o sistema de alianças e imperialismo.' },
    { q: 'O que foi o AI-5 (1968) durante a Ditadura Militar?', a: 'Ato Institucional que fechou o Congresso, suspendeu habeas corpus e censurou a imprensa. O ápice do autoritarismo.' },
    { q: 'O que é imperialismo?', a: 'Expansão política e econômica de países poderosos sobre nações mais fracas — base do colonialismo do séc. XIX–XX.' },
    { q: 'O que foi o Iluminismo?', a: 'Movimento intelectual do séc. XVIII que defendia razão, ciência e liberdade individual, contra o absolutismo.' },
    { q: 'O que é nazismo?', a: 'Ideologia totalitária de Adolf Hitler (1933–1945): ultranacionalismo, antissemitismo e racismo que levou ao Holocausto.' },
    { q: 'O que foi a Abolição da Escravidão no Brasil?', a: 'Lei Áurea (1888), assinada pela Princesa Isabel, libertou aproximadamente 700 mil escravizados — última nação das Américas.' },
  ],
  biologia: [
    { q: 'Qual a diferença entre célula procarionte e eucarionte?', a: 'Procarionte: sem núcleo definido (ex: bactérias). Eucarionte: núcleo organizado por membrana (ex: animais, plantas).' },
    { q: 'Escreva a equação simplificada da fotossíntese.', a: '6CO₂ + 6H₂O + luz → C₆H₁₂O₆ + 6O₂. Plantas convertem energia solar em glicose no cloroplasto.' },
    { q: 'O que é meiose e para que serve?', a: 'Divisão celular que gera 4 células haploides (metade do DNA). Essencial para a reprodução sexuada.' },
    { q: 'O que é mutualismo? Dê um exemplo.', a: 'Relação entre espécies onde ambas se beneficiam. Ex: abelhas (polinização) e flores (néctar).' },
    { q: 'Qual a diferença entre vírus e bactéria?', a: 'Vírus: acelular, replica apenas dentro de hospedeiro. Bactéria: unicelular procarionte, pode viver de forma independente.' },
    { q: 'O que é seleção natural (Darwin)?', a: 'Organismos mais adaptados ao ambiente sobrevivem e se reproduzem mais, transmitindo seus genes às gerações seguintes.' },
    { q: 'O que é a 1ª Lei de Mendel?', a: 'Lei da Segregação: cada indivíduo possui 2 alelos por gene; eles se separam na formação dos gametas.' },
    { q: 'O que é homeostase?', a: 'Capacidade do organismo de manter equilíbrio interno (temperatura, pH, glicemia) mesmo com variações do ambiente externo.' },
    { q: 'O que é DNA e qual sua função?', a: 'Molécula dupla hélice que carrega toda informação genética. Cada gene codifica uma proteína específica.' },
    { q: 'Defina cadeia alimentar e seus componentes.', a: 'Sequência de transferência de energia: Produtores (plantas) → Consumidores (animais) → Decompositores (fungos, bactérias).' },
  ],
  quimica: [
    { q: 'O que é estequiometria?', a: 'Cálculo das proporções entre reagentes e produtos usando os coeficientes da equação química balanceada (regra de 3).' },
    { q: 'Qual a diferença entre ácido e base (Arrhenius)?', a: 'Ácido: libera H⁺ em água. Base: libera OH⁻ em água. Ex: HCl (ácido) vs NaOH (base).' },
    { q: 'Como interpretar o pH?', a: 'Escala 0–14. pH < 7 = ácido. pH = 7 = neutro. pH > 7 = básico. Quanto menor o pH, mais ácido.' },
    { q: 'O que é ligação iônica?', a: 'Transferência de elétrons entre metal e não-metal, gerando íons de cargas opostas que se atraem. Ex: NaCl.' },
    { q: 'Defina oxidação e redução. Qual o macete?', a: 'Oxidação: perde elétrons (LEO). Redução: ganha elétrons (GER). Reações redox ocorrem sempre em par.' },
    { q: 'O que são isômeros?', a: 'Compostos com mesma fórmula molecular mas estruturas diferentes. Ex: butano e isobutano (ambos C₄H₁₀).' },
    { q: 'O que é entalpia? Como identificar reação exo/endotérmica?', a: 'ΔH < 0: exotérmica (libera calor). ΔH > 0: endotérmica (absorve calor).' },
    { q: 'Como identificar uma reação de combustão?', a: 'Composto orgânico + O₂ → CO₂ + H₂O. Ex: CH₄ + 2O₂ → CO₂ + 2H₂O.' },
    { q: 'O que é o número de Avogadro?', a: '6,02 × 10²³ partículas por mol. Permite relacionar gramas com quantidade de átomos e moléculas.' },
    { q: 'O que é eletrólise?', a: 'Processo que usa corrente elétrica para forçar reações não-espontâneas. Ex: eletrólise da água → H₂ + O₂.' },
  ],
  geografia: [
    { q: 'O que é globalização?', a: 'Integração econômica, cultural e tecnológica mundial, acelerada após anos 1990. Gera interdependência entre países.' },
    { q: 'O que mede o IDH?', a: 'Índice de Desenvolvimento Humano: combina renda per capita, escolaridade e expectativa de vida (escala 0–1).' },
    { q: 'Quais as causas do aquecimento global?', a: 'Emissão de gases do efeito estufa (CO₂, CH₄) por combustíveis fósseis, desmatamento e agropecuária intensiva.' },
    { q: 'O que é êxodo rural?', a: 'Migração campo → cidade em busca de emprego/serviços. Causa principal: mecanização e modernização do campo.' },
    { q: 'O que é transição demográfica?', a: 'Mudança de alta natalidade/mortalidade para baixa natalidade/mortalidade, associada ao desenvolvimento econômico.' },
    { q: 'O que são placas tectônicas?', a: 'Blocos rígidos da litosfera em movimento. Seu encontro causa terremotos, vulcões e formação de cadeias montanhosas.' },
    { q: 'O que é bioma? Cite exemplos brasileiros.', a: 'Grande ecossistema com clima, flora e fauna específicos. Ex: Amazônia, Cerrado, Caatinga, Mata Atlântica, Pampa.' },
    { q: 'Como a latitude influencia o clima?', a: 'Maior latitude = mais frio. Define zonas climáticas: tropical (0–23°), temperada (23–66°), polar (>66°).' },
    { q: 'O que é intemperismo?', a: 'Degradação das rochas por agentes físicos, químicos e biológicos. Processo responsável pela formação do solo.' },
    { q: 'O que é a ZCIT (Zona de Convergência Intertropical)?', a: 'Faixa de baixa pressão próxima ao Equador onde massas de ar convergem → chuvas intensas no Norte do Brasil.' },
  ],
};

export const UNIVERSITIES = [
  'USP – Medicina', 'USP – Engenharia', 'USP – Direito',
  'UNICAMP – Medicina', 'UNICAMP – Computação', 'UNICAMP – Engenharia',
  'UFRJ – Medicina', 'UFRJ – Direito', 'UFRJ – Engenharia',
  'UFMG – Medicina', 'UFMG – Direito',
  'UnB – Medicina', 'UnB – Direito',
  'UFPE – Medicina', 'UFPE – Engenharia',
  'UNESP – Medicina', 'UNESP – Odontologia',
  'UFSC – Medicina', 'UFSC – Computação',
  'UFC – Medicina', 'UFC – Engenharia',
  'UFBA – Medicina', 'UFBA – Direito',
  'PUC-SP – Direito', 'PUC-Rio – Engenharia',
  'FGV – Administração', 'FGV – Direito',
  'ITA – Engenharia Aeronáutica',
  'IME – Engenharia Militar',
  'Outro curso / concurso público',
];
