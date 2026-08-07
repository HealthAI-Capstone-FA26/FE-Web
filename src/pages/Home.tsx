import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { HeroSection } from '../components/home/HeroSection';
import { SystemOverviewSection } from '../components/home/SystemOverviewSection';
import { ValuesSection } from '../components/home/ValuesSection';
import { EquipmentSection } from '../components/home/EquipmentSection';
import { ServicesSection } from '../components/home/ServicesSection';
import { NewsSection } from '../components/home/NewsSection';
import { VideoSection } from '../components/home/VideoSection';

const Home = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900 flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <HeroSection />
        <SystemOverviewSection />
        <ValuesSection />
        <EquipmentSection />
        <ServicesSection />
        <NewsSection />
        <VideoSection />
      </main>

      <Footer />
    </div>
  );
};

export default Home;
