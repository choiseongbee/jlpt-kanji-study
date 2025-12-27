import { getSessions } from '../services/storageService';

export const History = () => {
  const sessions = getSessions();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">학습 기록</h1>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-500 text-xl">아직 학습 기록이 없습니다</p>
            <p className="text-gray-400 mt-2">대시보드에서 학습을 시작해보세요!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.slice().reverse().map((session) => {
              const accuracy = Math.round(
                (session.correctAnswers / session.totalQuestions) * 100
              );

              return (
                <div key={session.id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-lg font-bold">
                        {new Date(session.date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(session.date).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-blue-600">{accuracy}%</p>
                      <p className="text-sm text-gray-600">정답률</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded text-center">
                      <p className="text-sm text-gray-600">총 문제</p>
                      <p className="text-2xl font-bold">{session.totalQuestions}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded text-center">
                      <p className="text-sm text-gray-600">정답</p>
                      <p className="text-2xl font-bold text-green-600">
                        {session.correctAnswers}
                      </p>
                    </div>
                    <div className="bg-red-50 p-3 rounded text-center">
                      <p className="text-sm text-gray-600">오답</p>
                      <p className="text-2xl font-bold text-red-600">
                        {session.totalQuestions - session.correctAnswers}
                      </p>
                    </div>
                  </div>

                  {session.results && session.results.length > 0 && (
                    <div className="mt-4">
                      <details className="cursor-pointer">
                        <summary className="font-medium text-blue-600 hover:underline">
                          상세 결과 보기
                        </summary>
                        <div className="mt-4 space-y-3">
                          {session.results.map((result) => (
                            <div
                              key={result.wordId}
                              className={`p-3 rounded ${
                                result.isCorrect ? 'bg-green-50' : 'bg-red-50'
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <span className="text-3xl">{result.word.kanji}</span>
                                <div className="flex-1">
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-gray-600">히라가나: </span>
                                      <span
                                        className={
                                          result.hiraganaCorrect
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                        }
                                      >
                                        {result.word.hiragana}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">뜻: </span>
                                      <span
                                        className={
                                          result.meaningCorrect
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                        }
                                      >
                                        {result.word.meaning}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <span className="text-2xl">
                                  {result.isCorrect ? '✓' : '✗'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
