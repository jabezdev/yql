import Navbar from './components/landing/Navbar';
import Hero from './components/landing/Hero';
import Footer from './components/landing/Footer';

function App() {
  return (
    <div className="bg-brand-bgLight min-h-screen text-brand-blueDark font-sans selection:bg-brand-yellow/30 selection:text-brand-blueDark">
      <Navbar />
      <Hero />
      <Footer />
    </div>
  )
}

export default App
