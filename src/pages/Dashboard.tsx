import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { JLPTLevel } from '../types';
import {
  getCurrentLevel,
  setCurrentLevel,
  getSessions,
  getUnmasteredWrongWords,
} from '../services/storageService';
import {
  getTotalWordCount,
  getStudiedWordCount,
  getRemainingWordCount,
} from '../services/questionGenerator';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [level, setLevel] = useState<JLPTLevel>(getCurrentLevel());
  const sessions = getSessions();
  const wrongWords = getUnmasteredWrongWords();

  const totalWords = getTotalWordCount(level);
  const studiedWords = getStudiedWordCount(level);
  const remainingWords = getRemainingWordCount(level);

  const handleLevelChange = (newLevel: JLPTLevel) => {
    setLevel(newLevel);
    setCurrentLevel(newLevel);
  };

  const handleStartStudy = () => {
    navigate('/study', { state: { level } });
  };

  const accuracy = sessions.length > 0
    ? Math.round(
        (sessions.reduce((sum, s) => sum + s.correctAnswers, 0) /
          sessions.reduce((sum, s) => sum + s.totalQuestions, 0)) *
          100
      )
    : 0;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-4xl font-bold mb-8 text-center">JLPT 한자 학습</h1>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">레벨 선택</h2>
          <div className="flex gap-4 mb-6">
            {(['N4', 'N3', 'N2', 'ALL'] as JLPTLevel[]).map((l) => (
              <button
                key={l}
                onClick={() => handleLevelChange(l)}
                className={`flex-1 py-4 rounded-lg text-xl font-bold transition ${
                  level === l
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {l === 'ALL' ? '랜덤 (전체)' : l}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-gray-600 text-sm">총 단어 수</p>
              <p className="text-3xl font-bold text-blue-600">{totalWords}</p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <p className="text-gray-600 text-sm">학습한 단어</p>
              <p className="text-3xl font-bold text-green-600">{studiedWords}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded">
              <p className="text-gray-600 text-sm">남은 단어</p>
              <p className="text-3xl font-bold text-orange-600">{remainingWords}</p>
            </div>
          </div>

          <button
            onClick={handleStartStudy}
            className="w-full bg-blue-600 text-white py-4 rounded-lg text-xl font-bold hover:bg-blue-700"
          >
            학습 시작
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">학습 통계</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">총 학습 세션</span>
                <span className="font-bold">{sessions.length}회</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">전체 정답률</span>
                <span className="font-bold text-blue-600">{accuracy}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">복습 필요 단어</span>
                <span className="font-bold text-red-600">{wrongWords.length}개</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">최근 학습 기록</h3>
            {sessions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">아직 학습 기록이 없습니다</p>
            ) : (
              <div className="space-y-3">
                {sessions.slice(-5).reverse().map((session) => (
                  <div key={session.id} className="border-b pb-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        {new Date(session.date).toLocaleDateString()}
                      </span>
                      <span className="font-bold">
                        {session.correctAnswers}/{session.totalQuestions}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
