import type { KanjiWord, JLPTLevel } from '../types';
import { getStudiedWords, getUnmasteredWrongWords, getSessionCount } from './storageService';
import kanjiN4 from '../data/kanji_n4.json';
import kanjiN3 from '../data/kanji_n3.json';
import kanjiN2 from '../data/kanji_n2.json';
import kanjiCommon1 from '../data/kanji_common_1.json';
import kanjiCommon2 from '../data/kanji_common_2.json';
import kanjiCommon3 from '../data/kanji_common_3.json';
import kanjiCommon4 from '../data/kanji_common_4.json';
import kanjiCommon5 from '../data/kanji_common_5.json';
import kanjiCommon6 from '../data/kanji_common_6.json';
import kanjiCommon7 from '../data/kanji_common_7.json';
import kanjiCommon8 from '../data/kanji_common_8.json';
import kanjiCommon9 from '../data/kanji_common_9.json';
import kanjiCommon10 from '../data/kanji_common_10.json';

// Load all words for a given level
export const loadKanjiWords = (level: JLPTLevel): KanjiWord[] => {
  switch (level) {
    case 'N4':
      return kanjiN4 as KanjiWord[];
    case 'N3':
      return kanjiN3 as KanjiWord[];
    case 'N2':
      return kanjiN2 as KanjiWord[];
    case 'ALL':
      return [
        ...(kanjiN4 as KanjiWord[]),
        ...(kanjiN3 as KanjiWord[]),
        ...(kanjiN2 as KanjiWord[]),
        ...(kanjiCommon1 as KanjiWord[]),
        ...(kanjiCommon2 as KanjiWord[]),
        ...(kanjiCommon3 as KanjiWord[]),
        ...(kanjiCommon4 as KanjiWord[]),
        ...(kanjiCommon5 as KanjiWord[]),
        ...(kanjiCommon6 as KanjiWord[]),
        ...(kanjiCommon7 as KanjiWord[]),
        ...(kanjiCommon8 as KanjiWord[]),
        ...(kanjiCommon9 as KanjiWord[]),
        ...(kanjiCommon10 as KanjiWord[])
      ];
    default:
      return kanjiN4 as KanjiWord[];
  }
};

// Shuffle array using Fisher-Yates algorithm
export const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Generate daily questions based on study progress
export const generateDailyQuestions = (level: JLPTLevel): KanjiWord[] => {
  // 1. Load data from localStorage
  const studiedWordIds = getStudiedWords();
  const sessionCount = getSessionCount();

  // 2. Load all words for current level
  const allWords = loadKanjiWords(level);

  // 3. First session vs subsequent sessions
  if (sessionCount === 0) {
    // First session: 10 new words only
    const newWords = allWords
      .filter(word => !studiedWordIds.includes(word.id));

    const shuffled = shuffleArray(newWords);
    return shuffled.slice(0, 10);
  } else {
    // Subsequent sessions: 10 random studied words + 10 new words

    // Get 10 random words from already studied words
    const studiedWords = allWords
      .filter(word => studiedWordIds.includes(word.id));

    const shuffledStudied = shuffleArray(studiedWords);
    const reviewWords = shuffledStudied.slice(0, 10);

    // Get new words (10)
    const newWords = allWords
      .filter(word => !studiedWordIds.includes(word.id));

    const shuffledNewWords = shuffleArray(newWords);
    const selectedNewWords = shuffledNewWords.slice(0, 10);

    // Combine and shuffle
    const allQuestions = [...reviewWords, ...selectedNewWords];
    return shuffleArray(allQuestions);
  }
};

// Get new words that haven't been studied yet
export const getNewWords = (level: JLPTLevel, count: number): KanjiWord[] => {
  const studiedWordIds = getStudiedWords();
  const allWords = loadKanjiWords(level);

  const newWords = allWords
    .filter(word => !studiedWordIds.includes(word.id))
    .slice(0, count * 2); // Get more candidates

  const shuffled = shuffleArray(newWords);
  return shuffled.slice(0, count);
};

// Get wrong words for review
export const getWrongWordsForReview = (level: JLPTLevel, count: number): KanjiWord[] => {
  const wrongWords = getUnmasteredWrongWords();
  const allWords = loadKanjiWords(level);

  const wrongWordIds = wrongWords
    .sort((a, b) => b.wrongCount - a.wrongCount) // Sort by wrong count (most wrong first)
    .slice(0, count)
    .map(w => w.wordId);

  return allWords.filter(word => wrongWordIds.includes(word.id));
};

// Check if there are enough new words for a session
export const hasEnoughNewWords = (level: JLPTLevel, required: number): boolean => {
  const studiedWordIds = getStudiedWords();
  const allWords = loadKanjiWords(level);
  const availableNewWords = allWords.filter(word => !studiedWordIds.includes(word.id));
  return availableNewWords.length >= required;
};

// Get total word count for a level
export const getTotalWordCount = (level: JLPTLevel): number => {
  return loadKanjiWords(level).length;
};

// Get studied word count for a level
export const getStudiedWordCount = (level: JLPTLevel): number => {
  const studiedWordIds = getStudiedWords();
  const allWords = loadKanjiWords(level);
  return allWords.filter(word => studiedWordIds.includes(word.id)).length;
};

// Get remaining word count for a level
export const getRemainingWordCount = (level: JLPTLevel): number => {
  const total = getTotalWordCount(level);
  const studied = getStudiedWordCount(level);
  return total - studied;
};

// Calculate level completion percentage
export const getLevelCompletion = (level: JLPTLevel): number => {
  const total = getTotalWordCount(level);
  const studied = getStudiedWordCount(level);
  return total > 0 ? Math.round((studied / total) * 100) : 0;
};
