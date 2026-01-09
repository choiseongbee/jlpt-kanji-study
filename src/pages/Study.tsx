import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { KanjiWord, UserAnswer, AnswerResult, JLPTLevel } from '../types';
import { generateDailyQuestions, shuffleArray } from '../services/questionGenerator';
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
  const [showRoundResults, setShowRoundResults] = useState(false);
  const [currentRoundResults, setCurrentRoundResults] = useState<AnswerResult[]>([]);
  const [allRoundResults, setAllRoundResults] = useState<AnswerResult[]>([]);
  const [currentRound, setCurrentRound] = useState(1);

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
      // 현재 라운드 종료 - 채점하기
      checkRoundAndContinue(newAnswers);
    }
  };

  const handlePass = () => {
    if (!currentQuestion) return;

    // 빈 답변을 제출하여 틀린 것으로 처리
    const answer: UserAnswer = {
      wordId: currentQuestion.id,
      hiragana: '',
      meaning: '',
    };

    const newAnswers = [...userAnswers, answer];
    setUserAnswers(newAnswers);
    setHiraganaInput('');
    setMeaningInput('');

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // 현재 라운드 종료 - 채점하기
      checkRoundAndContinue(newAnswers);
    }
  };

  const checkRoundAndContinue = (answers: UserAnswer[]) => {
    // 현재 라운드 채점
    const graded = gradeAnswers(questions, answers);

    // 전체 결과에 추가
    const updatedAllResults = [...allRoundResults, ...graded];
    setAllRoundResults(updatedAllResults);

    // 현재 라운드 결과 저장
    setCurrentRoundResults(graded);

    // 라운드 결과 화면 표시
    setShowRoundResults(true);
  };

  const handleReview = () => {
    // 틀린 문제만 필터링
    const wrongOnes = currentRoundResults.filter(r => !r.isCorrect);

    if (wrongOnes.length > 0) {
      // 틀린 문제로 새 라운드 시작 (순서 섞기)
      const wrongWords = wrongOnes.map(r => r.word);
      const shuffledWrongWords = shuffleArray(wrongWords);
      setQuestions(shuffledWrongWords);
      setCurrentIndex(0);
      setUserAnswers([]);
      setCurrentRound(currentRound + 1);
      setShowRoundResults(false);
    } else {
      // 틀린 문제가 없으면 세션 종료
      finishSession(allRoundResults);
    }
  };

  const handleFinishFromRound = () => {
    // 라운드 결과에서 세션 종료
    finishSession(allRoundResults);
  };

  const finishSession = (allResults: AnswerResult[]) => {
    // 최종 결과 저장 (중복 제거 - 가장 마지막 시도 결과만)
    const finalResults: AnswerResult[] = [];
    const seenIds = new Set<number>();

    // 역순으로 순회해서 가장 마지막 시도만 남김
    for (let i = allResults.length - 1; i >= 0; i--) {
      const result = allResults[i];
      if (!seenIds.has(result.wordId)) {
        finalResults.unshift(result);
        seenIds.add(result.wordId);
      }
    }

    const correctIds = getCorrectWordIds(finalResults);
    const wrongIds = getWrongWordIds(finalResults);

    // 첫 라운드 문제들만 저장 (처음 출제된 문제들)
    const firstRoundQuestionIds = Array.from(new Set(allResults.map(r => r.wordId)));
    addStudiedWords(firstRoundQuestionIds);

    correctIds.forEach(id => {
      markWordAsMastered(id);
    });

    wrongIds.forEach(id => {
      addWrongWord(id);
    });

    const session = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      totalQuestions: firstRoundQuestionIds.length,
      correctAnswers: correctIds.length,
      completedAt: new Date().toISOString(),
      results: finalResults,
    };

    addSession(session);
    incrementWordsStudied(firstRoundQuestionIds.length);

    // 결과 화면에 표시할 데이터 설정
    setAllRoundResults(finalResults);
    setShowRoundResults(false);
    setShowResults(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && hiraganaInput && meaningInput) {
      handleNext();
    }
  };

  const handleKanjiClick = (character: string) => {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(character)}`;
    window.open(searchUrl, '_blank');
  };

  const renderKanjiWithClick = (kanji: string) => {
    return kanji.split('').map((char, index) => (
      <span
        key={index}
        onClick={() => handleKanjiClick(char)}
        className="cursor-pointer hover:text-blue-600 transition-colors"
        style={{ userSelect: 'none' }}
      >
        {char}
      </span>
    ));
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

  if (showRoundResults) {
    const correctCount = currentRoundResults.filter(r => r.isCorrect).length;
    const wrongCount = currentRoundResults.filter(r => !r.isCorrect).length;
    const accuracy = Math.round((correctCount / currentRoundResults.length) * 100);

    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-center mb-6">
              {currentRound === 1 ? '라운드 결과' : `${currentRound}차 복습 결과`}
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-blue-50 rounded">
                <p className="text-gray-600">총 문제</p>
                <p className="text-3xl font-bold">{currentRoundResults.length}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded">
                <p className="text-gray-600">정답</p>
                <p className="text-3xl font-bold text-green-600">{correctCount}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded">
                <p className="text-gray-600">오답</p>
                <p className="text-3xl font-bold text-red-600">{wrongCount}</p>
              </div>
            </div>

            <div className="text-center mb-8">
              <p className="text-xl mb-2">정답률</p>
              <p className="text-5xl font-bold text-blue-600">{accuracy}%</p>
            </div>

            {wrongCount > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4 text-red-600">틀린 문제</h3>
                {currentRoundResults.filter(r => !r.isCorrect).map((result) => (
                  <div key={result.wordId} className="border-b py-4">
                    <div className="text-4xl font-bold mb-2">
                      {renderKanjiWithClick(result.word.kanji)}
                    </div>
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
              </div>
            )}

            {correctCount > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4 text-green-600">맞은 문제</h3>
                {currentRoundResults.filter(r => r.isCorrect).map((result) => (
                  <div key={result.wordId} className="border-b py-4">
                    <div className="text-4xl font-bold mb-2">
                      {renderKanjiWithClick(result.word.kanji)}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">히라가나</p>
                        <p className="font-bold text-green-600">{result.word.hiragana}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">뜻</p>
                        <p className="font-bold text-green-600">{result.word.meaning}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {wrongCount > 0 ? (
              <div className="flex gap-4">
                <button
                  onClick={handleFinishFromRound}
                  className="flex-1 bg-gray-500 text-white py-4 rounded-lg text-xl font-bold hover:bg-gray-600"
                >
                  학습 종료
                </button>
                <button
                  onClick={handleReview}
                  className="flex-1 bg-blue-600 text-white py-4 rounded-lg text-xl font-bold hover:bg-blue-700"
                >
                  복습하기 ({wrongCount}문제)
                </button>
              </div>
            ) : (
              <button
                onClick={handleReview}
                className="w-full bg-blue-600 text-white py-4 rounded-lg text-xl font-bold hover:bg-blue-700"
              >
                완료
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const correctCount = allRoundResults.filter(r => r.isCorrect).length;
    const accuracy = Math.round((correctCount / allRoundResults.length) * 100);

    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-center mb-6">학습 완료!</h2>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-blue-50 rounded">
                <p className="text-gray-600">총 문제</p>
                <p className="text-3xl font-bold">{allRoundResults.length}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded">
                <p className="text-gray-600">정답</p>
                <p className="text-3xl font-bold text-green-600">{correctCount}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded">
                <p className="text-gray-600">오답</p>
                <p className="text-3xl font-bold text-red-600">{allRoundResults.length - correctCount}</p>
              </div>
            </div>

            <div className="text-center mb-8">
              <p className="text-xl mb-2">정답률</p>
              <p className="text-5xl font-bold text-blue-600">{accuracy}%</p>
            </div>

            {allRoundResults.filter(r => !r.isCorrect).length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4 text-red-600">최종 틀린 문제</h3>
                {allRoundResults.filter(r => !r.isCorrect).map((result) => (
                  <div key={result.wordId} className="border-b py-4">
                    <div className="text-4xl font-bold mb-2">
                      {renderKanjiWithClick(result.word.kanji)}
                    </div>
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
              </div>
            )}

            {correctCount > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-4 text-green-600">맞은 문제</h3>
                {allRoundResults.filter(r => r.isCorrect).map((result) => (
                  <div key={result.wordId} className="border-b py-4">
                    <div className="text-4xl font-bold mb-2">
                      {renderKanjiWithClick(result.word.kanji)}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">히라가나</p>
                        <p className="font-bold text-green-600">{result.word.hiragana}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">뜻</p>
                        <p className="font-bold text-green-600">{result.word.meaning}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {allRoundResults.filter(r => !r.isCorrect).length === 0 && (
              <div className="mb-8 text-center">
                <p className="text-2xl text-green-600 font-bold py-4">모든 문제를 맞췄습니다!</p>
              </div>
            )}

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
              <span className="text-gray-600">
                {currentRound === 1 ? '진행 상황' : `${currentRound}차 복습 중`}
              </span>
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

            <div className="flex gap-4 mt-6">
              <button
                onClick={handlePass}
                className="flex-1 bg-gray-500 text-white py-4 rounded-lg text-xl font-bold hover:bg-gray-600"
              >
                패스
              </button>
              <button
                onClick={handleNext}
                disabled={!hiraganaInput || !meaningInput}
                className="flex-1 bg-blue-600 text-white py-4 rounded-lg text-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {currentIndex < questions.length - 1 ? '다음' : '완료'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
