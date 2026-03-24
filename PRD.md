# 📑 PRD: FlashAprova – Plataforma Premium de Memorização (v3.1)

## 1. Visão Geral e Estratégia
O **FlashAprova** é uma plataforma de estudo gamificada e inteligente para aprovação no ENEM e concursos. O sistema utiliza um algoritmo de revisão espaçada (SRS) para otimizar a retenção de conteúdo.

* **Diferencial**: Curadoria exclusiva feita por especialista em marketing de Recife.
* **Tom de Voz**: Descolado e motivador (Ex: "E aí, [Nome]! Bora moer esses cards?").

---

## 2. Identidade Visual (Design System)
* **Fundo**: "Deep Space" com grid verde neon.
* **Cores**: Roxo Elétrico (Ação) e Verde Neon (Status/Fácil).
* **Efeitos**: Glassmorphism, bordas neon e ilustrações vibrantes.
* **Mobile-First**: Botões de no mínimo 48px e navegação inferior.

---

## 3. Inteligência Algorítmica (SRS v2.2)
O cálculo do intervalo de dias ($I$) para a próxima revisão segue a fórmula:

$$I = (I_{prev} \times EF) \times (0.85^{L})$$

* **EF (Ease Factor)**: Inicia em 2.5. Aumenta (+0.15) no "Fácil" e cai (-0.20) no "Difícil".
* **L (Lapses)**: Total histórico de vezes que o usuário apertou "1 - Errei".
* **Loop do "Errei"**: Se o usuário apertar 1, o card volta na mesma sessão até receber nota ≥ 2.

---

## 4. Arquitetura de Dados (Supabase)
| Tabela | Campos Principais |
| :--- | :--- |
| **Subjects** | ID, Title, Icon_URL, Color. |
| **Decks** | ID, Subject_ID, Title. |
| **Cards** | ID, Deck_ID, Question, Answer. |
| **User_Progress** | User_ID, Card_ID, EF, Lapses, History (JSONB), Next_Review. |

---

## 5. Estrutura de Telas
1. **Auth**: Login e Recuperação de Senha estilizados.
2. **Dashboard**: Cards de métricas ("Poder de Aprovação") e lista de Matérias/Decks.
3. **Modo Estudo**: Interface de flip card com botões de feedback 1 a 4.
4. **Painel Admin**: Área para upload de CSV e gestão de curadoria.
