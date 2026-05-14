const fs = require('fs');
const path = require('path');

// Mapping de arquivos JSON para deck IDs
const deckMapping = {
  // Colônia
  '01 - Período Pré-Colonial e Contatos Iniciais.json': 'c5bdcfb4-fc3d-4eed-a34c-609311dfbb27',
  '02 - Administração Colonial Capitanias e Governos Gerais.json': 'c5bdcfb4-fc3d-4eed-a34c-609311dfbb27',
  '03 - Economia Açucareira e Escravidão.json': 'c3603b0f-ef8f-4655-bc6d-8d8cbe9e8a39',
  '04 - Brasil Holandês e Bandeirantes.json': 'c3603b0f-ef8f-4655-bc6d-8d8cbe9e8a39',
  '05 - Ciclo da Mineração e Revolta de Vila Rica.json': 'b8cc0214-f5c3-441d-bdd9-6fdc966e37dd',
  '06 - Quilombos e Resistência Indígena.json': 'f7e0cb75-bf6a-47ca-9b9f-332fe65cf489',
  '07 - Crise do Sistema Colonial e Família Real.json': 'b8cc0214-f5c3-441d-bdd9-6fdc966e37dd',
  // Império
  '01 - Primeiro Reinado Independência e Constituição de 1824.json': '9c8bb940-7ec9-4235-8a95-912144924783',
  '02 - Período Regencial e Revoltas Provinciais.json': 'd72cd2e9-d354-4f86-9693-1481c8e2bdfb',
  '03 - Segundo Reinado Parlamentarismo e Guerra do Paraguai.json': '1e6b80c9-7dce-43ca-98cb-1fd4ba845023',
  '04 - Ciclo do Café Era Mauá e Trabalho Assalariado.json': '1e6b80c9-7dce-43ca-98cb-1fd4ba845023',
  '05 - Processo Abolicionista e Pós-Abolição.json': 'a3357d04-42d0-4f14-8cd9-69bd6d22c46f',
  '06 - Crise do Império e Proclamação da República.json': 'a3357d04-42d0-4f14-8cd9-69bd6d22c46f',
  // República
  '01 - República Velha Coronelismo e Tenentismo.json': 'eeb1a362-9398-4941-90fc-3278110248bc',
  '02 - Conflitos Sociais na Primeira República.json': 'b5e1324e-3ec8-45f8-ad50-5043ab89343b',
  '03 - Era Vargas Direitos Trabalhistas e Estado Novo.json': '11fcc071-9d39-4ae3-b5e3-b6f97ffd53e4',
  '04 - Período Democrático JK Populismo e Crise de Jango.json': 'b864b18f-c7a0-478f-8b67-f2e076f1ba24',
  '05 - Ditadura Civil-Militar AI-5 e Diretas Já.json': 'e37fcf90-4f51-49bf-bac3-09c80a7610c8',
  '06 - Nova República Constituição de 1988 e Plano Real.json': '9a8d81a0-ab2b-444e-ac52-e71096d2f01a',
  '07 - Cidadania e Movimentos Sociais.json': '92f8d940-0a5a-42e8-bde2-0f00f96ea19e',
};

const baseDir = 'JSON FLASHCARDS/HISTORIA DO BRASIL';
const modules = fs.readdirSync(baseDir);

let allCards = [];
let fileIndex = {};

for (const moduleFolder of modules) {
  if (moduleFolder.startsWith('.')) continue;
  const modulePath = path.join(baseDir, moduleFolder);
  if (!fs.statSync(modulePath).isDirectory()) continue;

  const files = fs.readdirSync(modulePath).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(modulePath, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const deckId = deckMapping[file];

    if (!deckId) {
      console.warn(`⚠️ Arquivo não mapeado: ${file}`);
      continue;
    }

    fileIndex[file] = { deckId, cards: content.length };

    for (const card of content) {
      allCards.push({
        deck_id: deckId,
        question: card.frente,
        answer: card.verso,
      });
    }
  }
}

// Gerar SQL INSERT
let sql = 'INSERT INTO cards (deck_id, question, answer) VALUES\n';
const values = allCards.map((card, i) => {
  const q = card.question.replace(/'/g, "''");
  const a = card.answer.replace(/'/g, "''");
  return `('${card.deck_id}', '${q}', '${a}')`;
});

sql += values.join(',\n') + ';\n';

// Salvar SQL
fs.writeFileSync('/tmp/insert-cards.sql', sql);

// Mostrar resumo
console.log(`\n📊 RESUMO DA CARGA`);
console.log(`📁 Arquivos processados: ${Object.keys(fileIndex).length}`);
console.log(`📝 Total de cards: ${allCards.length}`);
console.log('\nDetalhes por arquivo:');
Object.entries(fileIndex).forEach(([file, info]) => {
  console.log(`  ${file}: ${info.cards} cards → deck ${info.deckId}`);
});

console.log(`\n✅ SQL gerado em: /tmp/insert-cards.sql`);
console.log(`\nPróximo passo: executar SQL no banco de dados`);
