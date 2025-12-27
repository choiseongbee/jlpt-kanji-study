import type { AnswerResult } from './word';

export interface StudySession {
  id: string;
  date: string;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: string;
  results: AnswerResult[];
}

export interface SessionSummary {
  sessionId: string;
  date: string;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  accuracy: number; // percentage
}
