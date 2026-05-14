import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

interface Card {
  frente: string;
  verso: string;
}

// Supabase config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mapping of JSON files to deck IDs
const deckMapping: Record<string, string> = {
  // Module 1: Colônia
  "01 - Período Pré-Colonial e Contatos Iniciais.json":
    "c5bdcfb4-fc3d-4eed-a34c-609311dfbb27", // 01 - Período Pré-Colonial
  "02 - Administração Colonial Capitanias e Governos Gerais.json":
    "c5bdcfb4-fc3d-4eed-a34c-609311dfbb27", // 01 - Período Pré-Colonial
  "03 - Economia Açucareira e Escravidão.json":
    "c3603b0f-ef8f-4655-bc6d-8d8cbe9e8a39", // 02 - Ciclo do Açúcar
  "04 - Brasil Holandês e Bandeirantes.json":
    "c3603b0f-ef8f-4655-bc6d-8d8cbe9e8a39", // 02 - Ciclo do Açúcar
  "05 - Ciclo da Mineração e Revolta de Vila Rica.json":
    "b8cc0214-f5c3-441d-bdd9-6fdc966e37dd", // 04 - Ciclo do Ouro
  "06 - Quilombos e Resistência Indígena.json":
    "f7e0cb75-bf6a-47ca-9b9f-332fe65cf489", // 03 - Escravidão, Resistência
  "07 - Crise do Sistema Colonial e Família Real.json":
    "b8cc0214-f5c3-441d-bdd9-6fdc966e37dd", // 04 - Ciclo do Ouro

  // Module 2: Império
  "01 - Primeiro Reinado Independência e Constituição de 1824.json":
    "9c8bb940-7ec9-4235-8a95-912144924783", // 01 - Independência
  "02 - Período Regencial e Revoltas Provinciais.json":
    "d72cd2e9-d354-4f86-9693-1481c8e2bdfb", // 02 - Período Regencial
  "03 - Segundo Reinado Parlamentarismo e Guerra do Paraguai.json":
    "1e6b80c9-7dce-43ca-98cb-1fd4ba845023", // 03 - Segundo Reinado
  "04 - Ciclo do Café Era Mauá e Trabalho Assalariado.json":
    "1e6b80c9-7dce-43ca-98cb-1fd4ba845023", // 03 - Segundo Reinado
  "05 - Processo Abolicionista e Pós-Abolição.json":
    "a3357d04-42d0-4f14-8cd9-69bd6d22c46f", // 04 - Abolicionismo
  "06 - Crise do Império e Proclamação da República.json":
    "a3357d04-42d0-4f14-8cd9-69bd6d22c46f", // 04 - Abolicionismo

  // Module 3: República (spread across 3 DB modules)
  "01 - República Velha Coronelismo e Tenentismo.json":
    "eeb1a362-9398-4941-90fc-3278110248bc", // 01 - República Oligarquias
  "02 - Conflitos Sociais na Primeira República.json":
    "b5e1324e-3ec8-45f8-ad50-5043ab89343b", // 02 - Revoltas Populares
  "03 - Era Vargas Direitos Trabalhistas e Estado Novo.json":
    "11fcc071-9d39-4ae3-b5e3-b6f97ffd53e4", // 03 - Era Vargas
  "04 - Período Democrático JK Populismo e Crise de Jango.json":
    "b864b18f-c7a0-478f-8b67-f2e076f1ba24", // 01 - Período Populista
  "05 - Ditadura Civil-Militar AI-5 e Diretas Já.json":
    "e37fcf90-4f51-49bf-bac3-09c80a7610c8", // 02 - O Golpe de 1964
  "06 - Nova República Constituição de 1988 e Plano Real.json":
    "9a8d81a0-ab2b-444e-ac52-e71096d2f01a", // 01 - Constituição 1988
  "07 - Cidadania e Movimentos Sociais.json":
    "92f8d940-0a5a-42e8-bde2-0f00f96ea19e", // 03 - Brasil século XXI
};

async function uploadCards() {
  const baseDir = "/Users/brunomatheus/app-flashcards/JSON FLASHCARDS/HISTORIA DO BRASIL";

  const modules = fs.readdirSync(baseDir);
  let totalCards = 0;
  let totalErrors = 0;

  for (const moduleFolder of modules) {
    if (moduleFolder.startsWith(".")) continue;

    const modulePath = path.join(baseDir, moduleFolder);
    if (!fs.statSync(modulePath).isDirectory()) continue;

    console.log(`\n📂 Processando módulo: ${moduleFolder}`);

    const files = fs.readdirSync(modulePath).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      const filePath = path.join(modulePath, file);
      const deckId = deckMapping[file];

      if (!deckId) {
        console.log(`⚠️  Arquivo não mapeado: ${file}`);
        continue;
      }

      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const cards: Card[] = JSON.parse(content);

        // Validate format
        if (!Array.isArray(cards)) {
          throw new Error("JSON must be an array");
        }

        for (const card of cards) {
          if (!card.frente || !card.verso) {
            throw new Error(`Card inválido: ${JSON.stringify(card)}`);
          }
        }

        // Insert cards
        for (const card of cards) {
          const { error } = await supabase.from("cards").insert({
            deck_id: deckId,
            question: card.frente,
            answer: card.verso,
          });

          if (error) {
            console.error(`❌ Erro ao inserir card de ${file}:`, error);
            totalErrors++;
          } else {
            totalCards++;
          }
        }

        console.log(`✅ ${file}: ${cards.length} cards inseridos`);
      } catch (err) {
        console.error(`❌ Erro ao processar ${file}:`, err);
        totalErrors++;
      }
    }
  }

  console.log(`\n\n📊 RESUMO`);
  console.log(`✅ Total de cards inseridos: ${totalCards}`);
  console.log(`❌ Total de erros: ${totalErrors}`);
}

uploadCards().catch(console.error);
