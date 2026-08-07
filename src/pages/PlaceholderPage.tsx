import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export const PlaceholderPage = ({ title }: { title: string }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />
      <main className="flex-grow flex items-center justify-center py-20">
        <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-slate-100 max-w-2xl">
          <h1 className="text-3xl font-bold text-slate-800 mb-4">{title}</h1>
          <p className="text-slate-500">
            Trang này đang trong quá trình xây dựng. Vui lòng quay lại sau!
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};
