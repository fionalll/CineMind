export interface QuizAnswer {
  text: string;
  tags: string[];
}

export interface QuizQuestion {
  question: string;
  answers: QuizAnswer[];
}

export const quizData: QuizQuestion[] = [
  {
    question: "Bugün modun nasıl? Kendini nasıl hissediyorsun?",
    answers: [
      { text: "Enerjik ve heyecanlı!", tags: ['yüksek tempo', 'aksiyon', 'macera'] },
      { text: "Düşünceli ve sakin.", tags: ['yavaş tempolu', 'düşündürücü'] },
      { text: "Kahkahalara boğulmak istiyorum!", tags: ['komik', 'eğlenceli'] },
      { text: "Gergin ve meraklıyım.", tags: ['gizem', 'gerilim', 'sürpriz sonlu'] }
    ]
  },
  {
    question: "Filmde hangi temalar seni daha çok çeker?",
    answers: [
      { text: "Dostluk ve macera", tags: ['dostluk', 'macera'] },
      { text: "Aşk ve ilişkiler", tags: ['romantik', 'ilişkiler'] },
      { text: "Toplumsal meseleler", tags: ['toplumsal', 'dram'] },
      { text: "Bilim kurgu ve fantastik", tags: ['bilim kurgu', 'fantastik'] }
    ]
  },
  {
    question: "Hangi ortamda izlemeyi tercih edersin?",
    answers: [
      { text: "Arkadaşlarla birlikte", tags: ['grup', 'eğlenceli'] },
      { text: "Tek başıma", tags: ['kişisel', 'düşündürücü'] },
      { text: "Ailemle", tags: ['aile', 'her yaşa uygun'] },
      { text: "Sevgilimle", tags: ['romantik', 'duygusal'] }
    ]
  },
  {
    question: "Film süresi tercihin nedir?",
    answers: [
      { text: "Kısa ve öz (90dk civarı)", tags: ['kısa film', 'tempolu'] },
      { text: "Uzun, detaylı hikaye", tags: ['uzun film', 'epik'] },
      { text: "Farketmez, yeter ki güzel olsun", tags: ['her tür', 'kaliteli'] }
    ]
  }
];
