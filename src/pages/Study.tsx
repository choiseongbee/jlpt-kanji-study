import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { KanjiWord, UserAnswer, AnswerResult, JLPTLevel } from '../types';
import { generateDailyQuestions } from '../services/questionGenerator';
import { gradeAnswers, getWrongWordIds, getCorrectWordIds } from '../services/grader';
import {
  addSession,
  addStudiedWords,
  addWrongWord,
  markWordAsMastered,
  incrementWordsStudied,
  getCurrentLevel,
} from '../services/storageService';

export const Study = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const level = (location.state?.level || getCurrentLevel()) as JLPTLevel;

  const [questions, setQuestions] = useState<KanjiWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [hiraganaInput, setHiraganaInput] = useState('');
  const [meaningInput, setMeaningInput] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<AnswerResult[]>([]);

  useEffect(() => {
    const qs = generateDailyQuestions(level);
    setQuestions(qs);
  }, [level]);

  const currentQuestion = questions[currentIndex];
  const progress = `${currentIndex + 1} / ${questions.length}`;

  const handleNext = () => {
    if (!currentQuestion) return;

    const answer: UserAnswer = {
      wordId: currentQuestion.id,
      hiragana: hiraganaInput,
      meaning: meaningInput,
    };

    const newAnswers = [...userAnswers, answer];
    setUserAnswers(newAnswers);
    setHiraganaInput('');
    setMeaningInput('');

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishSession(newAnswers);
    }
  };

  const finishSession = (answers: UserAnswer[]) => {
    const graded = gradeAnswers(questions, answers);
    setResults(graded);

    const correctIds = getCorrectWordIds(graded);
    const wrongIds = getWrongWordIds(graded);

    addStudiedWords(questions.map(q => q.id));

    correctIds.forEach(id => {
      markWordAsMastered(id);
    });

    wrongIds.forEach(id => {
      addWrongWord(id);
    });

    const session = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      totalQuestions: questions.length,
      correctAnswers: correctIds.length,
      completedAt: new Date().toISOString(),
      results: graded,
    };

    addSession(session);
    incrementWordsStudied(questions.length);

    setShowResults(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && hiraganaInput && meaningInput) {
      handleNext();
    }
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl">문제를 로딩중입니다...</p>
        </div>
      </div>
    );
  }

  if (showResults) {
    const correctCount = results.filter(r => r.isCorrect).length;
    const accuracy = Math.round((correctCount / results.length) * 100);

    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-center mb-6">학습 완료!</h2>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-blue-50 rounded">
                <p className="text-gray-600">총 문제</p>
                <p className="text-3xl font-bold">{results.length}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded">
                <p className="text-gray-600">정답</p>
                <p className="text-3xl font-bold text-green-600">{correctCount}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded">
                <p className="text-gray-600">오답</p>
                <p className="text-3xl font-bold text-red-600">{results.length - correctCount}</p>
              </div>
            </div>

            <div className="text-center mb-8">
              <p className="text-xl mb-2">정답률</p>
              <p className="text-5xl font-bold text-blue-600">{accuracy}%</p>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4">틀린 문제</h3>
              {results.filter(r => !r.isCorrect).map((result) => (
                <div key={result.wordId} className="border-b py-4">
                  <div className="text-4xl font-bold mb-2">{result.word.kanji}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">정답 (히라가나)</p>
                      <p className="font-bold text-green-600">{result.word.hiragana}</p>
                      <p className="text-sm text-gray-600 mt-2">내 답변</p>
                      <p className={result.hiraganaCorrect ? 'text-green-600' : 'text-red-600'}>
                        {result.userAnswer.hiragana || '(미입력)'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">정답 (뜻)</p>
                      <p className="font-bold text-green-600">{result.word.meaning}</p>
                      <p className="text-sm text-gray-600 mt-2">내 답변</p>
                      <p className={result.meaningCorrect ? 'text-green-600' : 'text-red-600'}>
                        {result.userAnswer.meaning || '(미입력)'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {results.filter(r => !r.isCorrect).length === 0 && (
                <p className="text-center text-gray-500 py-4">모든 문제를 맞췄습니다!</p>
              )}
            </div>

            <button
              onClick={() => navigate('/')}
              className="w-full bg-blue-600 text-white py-4 rounded-lg text-xl font-bold hover:bg-blue-700"
            >
              대시보드로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">진행 상황</span>
              <span className="text-xl font-bold text-blue-600">{progress}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="mb-8 text-center">
            <p className="text-sm text-gray-600 mb-4">다음 한자의 히라가나와 뜻을 입력하세요</p>
            <div className="text-8xl font-bold mb-8">{currentQuestion.kanji}</div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                히라가나
              </label>
              <input
                type="text"
                value={hiraganaInput}
                onChange={(e) => setHiraganaInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-blue-500"
                placeholder="예: たべる"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                뜻
              </label>
              <input
                type="text"
                value={meaningInput}
                onChange={(e) => setMeaningInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-blue-500"
                placeholder="예: 먹다"
              />
            </div>

            <button
              onClick={handleNext}
              disabled={!hiraganaInput || !meaningInput}
              className="w-full bg-blue-600 text-white py-4 rounded-lg text-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed mt-6"
            >
              {currentIndex < questions.length - 1 ? '다음' : '완료'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
