import type { KanjiWord, UserAnswer, AnswerResult } from '../types';

// Normalize string for comparison (remove spaces, convert to lowercase for meaning)
const normalizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, '');
};

// Check if hiragana matches
const checkHiragana = (correct: string, userInput: string): boolean => {
  const normalizedCorrect = normalizeString(correct);
  const normalizedUser = normalizeString(userInput);
  return normalizedCorrect === normalizedUser;
};

// Check if meaning matches
const checkMeaning = (correct: string, userInput: string): boolean => {
  const normalizedCorrect = normalizeString(correct.toLowerCase());
  const normalizedUser = normalizeString(userInput.toLowerCase());
  return normalizedCorrect === normalizedUser;
};

// Grade a single answer
export const gradeAnswer = (
  word: KanjiWord,
  userAnswer: UserAnswer
): AnswerResult => {
  const hiraganaCorrect = checkHiragana(word.hiragana, userAnswer.hiragana);
  const meaningCorrect = checkMeaning(word.meaning, userAnswer.meaning);
  const isCorrect = hiraganaCorrect && meaningCorrect;

  return {
    wordId: word.id,
    word,
    userAnswer,
    isCorrect,
    hiraganaCorrect,
    meaningCorrect,
  };
};

// Grade multiple answers
export const gradeAnswers = (
  words: KanjiWord[],
  userAnswers: UserAnswer[]
): AnswerResult[] => {
  return words.map(word => {
    const userAnswer = userAnswers.find(a => a.wordId === word.id);

    if (!userAnswer) {
      // No answer provided
      return {
        wordId: word.id,
        word,
        userAnswer: {
          wordId: word.id,
          hiragana: '',
          meaning: '',
        },
        isCorrect: false,
        hiraganaCorrect: false,
        meaningCorrect: false,
      };
    }

    return gradeAnswer(word, userAnswer);
  });
};

// Calculate overall accuracy
export const calculateAccuracy = (results: AnswerResult[]): number => {
  if (results.length === 0) return 0;

  const correctCount = results.filter(r => r.isCorrect).length;
  return Math.round((correctCount / results.length) * 100);
};

// Get correct count
export const getCorrectCount = (results: AnswerResult[]): number => {
  return results.filter(r => r.isCorrect).length;
};

// Get wrong count
export const getWrongCount = (results: AnswerResult[]): number => {
  return results.filter(r => !r.isCorrect).length;
};

// Get wrong word IDs
export const getWrongWordIds = (results: AnswerResult[]): number[] => {
  return results.filter(r => !r.isCorrect).map(r => r.wordId);
};

// Get correct word IDs
export const getCorrectWordIds = (results: AnswerResult[]): number[] => {
  return results.filter(r => r.isCorrect).map(r => r.wordId);
};

// Validate user input (basic validation)
export const validateUserAnswer = (userAnswer: UserAnswer): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!userAnswer.hiragana || userAnswer.hiragana.trim() === '') {
    errors.push('히라가나를 입력해주세요');
  }

  if (!userAnswer.meaning || userAnswer.meaning.trim() === '') {
    errors.push('뜻을 입력해주세요');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Check if all answers are provided
export const areAllAnswersProvided = (
  totalQuestions: number,
  userAnswers: UserAnswer[]
): boolean => {
  if (userAnswers.length !== totalQuestions) return false;

  return userAnswers.every(answer => {
    const { isValid } = validateUserAnswer(answer);
    return isValid;
  });
};
