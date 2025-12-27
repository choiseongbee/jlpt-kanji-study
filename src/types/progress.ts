import type { JLPTLevel } from './word';

export interface Progress {
  currentLevel: JLPTLevel;
  totalWordsStudied: number;
  lastStudyDate: string;
}

export interface Stats {
  level: JLPTLevel;
  totalWordsStudied: number;
  totalSessions: number;
  overallAccuracy: number;
  wrongWordsCount: number;
  lastStudyDate: string;
}
