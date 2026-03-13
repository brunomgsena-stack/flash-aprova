import { supabase } from '../lib/supabaseClient';

async function seed() {
  console.log('Iniciando alimentação do banco de dados...');

  // 1. Inserir Matéria (Subject)
  const { data: subject, error: sError } = await supabase
    .from('subjects')
    .insert([{
      title: 'Física',
      color: '#7C3AED',
      icon_url: 'zap'
    }])
    .select()
    .single();

  if (sError) {
    console.error('Erro ao inserir matéria:', sError.message);
    return;
  }
  console.log('Matéria criada:', subject.title);

  // 2. Inserir Deck (Baralho)
  const { data: deck, error: dError } = await supabase
    .from('decks')
    .insert([{
      subject_id: subject.id,
      title: 'Cinemática'
    }])
    .select()
    .single();

  if (dError) {
    console.error('Erro ao inserir deck:', dError.message);
    return;
  }
  console.log('Deck criado:', deck.title);

  // 3. Inserir Flashcards
  const { error: cError } = await supabase
    .from('cards')
    .insert([
      {
        deck_id: deck.id,
        question: 'Qual a fórmula da velocidade média?',
        answer: '$v = \\frac{\\Delta s}{\\Delta t}$'
      },
      {
        deck_id: deck.id,
        question: 'O que define o Movimento Retilíneo Uniforme (MRU)?',
        answer: 'Velocidade constante e trajetória reta.'
      },
      {
        deck_id: deck.id,
        question: 'Qual a unidade de aceleração no SI?',
        answer: 'm/s²'
      }
    ]);

  if (cError) {
    console.error('Erro ao inserir cards:', cError.message);
    return;
  }

  console.log('✅ 3 cards inseridos com sucesso!');
}

seed();
