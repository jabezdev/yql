import Navbar from './components/landing/Navbar';
import Hero from './components/landing/Hero';
import About from './components/landing/About';
import Mission from './components/landing/Mission';
import WhoCanApply from './components/landing/WhoCanApply';
import HowItWorks from './components/landing/HowItWorks';
import Committees from './components/landing/Committees';
import Benefits from './components/landing/Benefits';
import Commitment from './components/landing/Commitment';
import Apply from './components/landing/Apply';
import Footer from './components/landing/Footer';

function App() {
  return (
    <div className="bg-brand-bgLight min-h-screen text-brand-blueDark font-sans selection:bg-brand-yellow/30 selection:text-brand-blueDark">
      <Navbar />
      <Hero />
      <About />
      <Mission />
      <WhoCanApply />
      <HowItWorks />
      <Committees />
      <Benefits />
      <Commitment />
      <Apply />
      <Footer />
    </div>
  )
}

export default App
