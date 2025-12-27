export type JLPTLevel = 'N4' | 'N3' | 'N2';

export interface KanjiWord {
  id: number;
  kanji: string;
  hiragana: string;
  meaning: string;
  level: JLPTLevel;
}

export interface WrongWord {
  wordId: number;
  wrongCount: number;
  lastWrongDate: string;
  isMastered: boolean;
}

export interface UserAnswer {
  wordId: number;
  hiragana: string;
  meaning: string;
}

export interface AnswerResult {
  wordId: number;
  word: KanjiWord;
  userAnswer: UserAnswer;
  isCorrect: boolean;
  hiraganaCorrect: boolean;
  meaningCorrect: boolean;
}
