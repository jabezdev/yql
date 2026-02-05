import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import About from "../components/landing/About";
import Mission from "../components/landing/Mission";
import Benefits from "../components/landing/Benefits";
import Committees from "../components/landing/Committees";
import HowItWorks from "../components/landing/HowItWorks";
import WhoCanApply from "../components/landing/WhoCanApply";
import Commitment from "../components/landing/Commitment";
import Apply from "../components/landing/Apply";
import Footer from "../components/landing/Footer";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <Navbar />

            <main>
                <Hero />
                <About />
                <Mission />
                <Benefits />
                <Committees />
                <HowItWorks />
                <WhoCanApply />
                <Commitment />
                <Apply />
            </main>

            <Footer />
        </div>
    );
}
