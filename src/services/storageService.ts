import type { WrongWord, StudySession, Progress, JLPTLevel } from '../types';

const STORAGE_KEYS = {
  STUDIED_WORDS: 'jlpt_studied_words',
  WRONG_WORDS: 'jlpt_wrong_words',
  SESSIONS: 'jlpt_sessions',
  PROGRESS: 'jlpt_progress',
  CURRENT_LEVEL: 'jlpt_current_level',
} as const;

// Studied Words
export const getStudiedWords = (): number[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.STUDIED_WORDS);
  return stored ? JSON.parse(stored) : [];
};

export const addStudiedWord = (wordId: number): void => {
  const studied = getStudiedWords();
  if (!studied.includes(wordId)) {
    studied.push(wordId);
    localStorage.setItem(STORAGE_KEYS.STUDIED_WORDS, JSON.stringify(studied));
  }
};

export const addStudiedWords = (wordIds: number[]): void => {
  const studied = getStudiedWords();
  const newWords = wordIds.filter(id => !studied.includes(id));
  if (newWords.length > 0) {
    studied.push(...newWords);
    localStorage.setItem(STORAGE_KEYS.STUDIED_WORDS, JSON.stringify(studied));
  }
};

// Wrong Words
export const getWrongWords = (): WrongWord[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.WRONG_WORDS);
  return stored ? JSON.parse(stored) : [];
};

export const addWrongWord = (wordId: number): void => {
  const wrongWords = getWrongWords();
  const existing = wrongWords.find(w => w.wordId === wordId);

  if (existing) {
    existing.wrongCount += 1;
    existing.lastWrongDate = new Date().toISOString();
    existing.isMastered = false;
  } else {
    wrongWords.push({
      wordId,
      wrongCount: 1,
      lastWrongDate: new Date().toISOString(),
      isMastered: false,
    });
  }

  localStorage.setItem(STORAGE_KEYS.WRONG_WORDS, JSON.stringify(wrongWords));
};

export const markWordAsMastered = (wordId: number): void => {
  const wrongWords = getWrongWords();
  const word = wrongWords.find(w => w.wordId === wordId);

  if (word) {
    word.isMastered = true;
    localStorage.setItem(STORAGE_KEYS.WRONG_WORDS, JSON.stringify(wrongWords));
  }
};

export const updateWrongWord = (wordId: number, isMastered: boolean): void => {
  const wrongWords = getWrongWords();
  const word = wrongWords.find(w => w.wordId === wordId);

  if (word) {
    word.isMastered = isMastered;
    localStorage.setItem(STORAGE_KEYS.WRONG_WORDS, JSON.stringify(wrongWords));
  }
};

export const getUnmasteredWrongWords = (): WrongWord[] => {
  return getWrongWords().filter(w => !w.isMastered);
};

// Sessions
export const getSessions = (): StudySession[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  return stored ? JSON.parse(stored) : [];
};

export const addSession = (session: StudySession): void => {
  const sessions = getSessions();
  sessions.push(session);
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
};

export const getSessionCount = (): number => {
  return getSessions().length;
};

export const getLatestSession = (): StudySession | null => {
  const sessions = getSessions();
  return sessions.length > 0 ? sessions[sessions.length - 1] : null;
};

// Progress
export const getProgress = (): Progress => {
  const stored = localStorage.getItem(STORAGE_KEYS.PROGRESS);
  if (stored) {
    return JSON.parse(stored);
  }

  // Default progress
  return {
    currentLevel: 'N4',
    totalWordsStudied: 0,
    lastStudyDate: '',
  };
};

export const updateProgress = (progress: Partial<Progress>): void => {
  const current = getProgress();
  const updated = { ...current, ...progress };
  localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(updated));
};

export const incrementWordsStudied = (count: number): void => {
  const progress = getProgress();
  progress.totalWordsStudied += count;
  progress.lastStudyDate = new Date().toISOString();
  localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
};

// Current Level
export const getCurrentLevel = (): JLPTLevel => {
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_LEVEL);
  return (stored as JLPTLevel) || 'N4';
};

export const setCurrentLevel = (level: JLPTLevel): void => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_LEVEL, level);
  updateProgress({ currentLevel: level });
};

// Reset all data
export const resetAllData = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

// Export data for backup
export const exportData = (): string => {
  const data = {
    studiedWords: getStudiedWords(),
    wrongWords: getWrongWords(),
    sessions: getSessions(),
    progress: getProgress(),
    currentLevel: getCurrentLevel(),
  };
  return JSON.stringify(data, null, 2);
};

// Import data from backup
export const importData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);

    if (data.studiedWords) {
      localStorage.setItem(STORAGE_KEYS.STUDIED_WORDS, JSON.stringify(data.studiedWords));
    }
    if (data.wrongWords) {
      localStorage.setItem(STORAGE_KEYS.WRONG_WORDS, JSON.stringify(data.wrongWords));
    }
    if (data.sessions) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(data.sessions));
    }
    if (data.progress) {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(data.progress));
    }
    if (data.currentLevel) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_LEVEL, data.currentLevel);
    }

    return true;
  } catch (error) {
    console.error('Failed to import data:', error);
    return false;
  }
};
