import { Link, useLocation } from 'react-router-dom';

export const Header = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            JLPT 한자 학습
          </Link>
          <nav className="flex gap-4">
            <Link
              to="/"
              className={`px-4 py-2 rounded ${
                isActive('/') ? 'bg-blue-700' : 'hover:bg-blue-500'
              }`}
            >
              대시보드
            </Link>
            <Link
              to="/history"
              className={`px-4 py-2 rounded ${
                isActive('/history') ? 'bg-blue-700' : 'hover:bg-blue-500'
              }`}
            >
              학습 기록
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};
