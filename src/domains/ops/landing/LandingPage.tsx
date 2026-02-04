import Navbar from '../../../core/components/landing/Navbar';
import Hero from '../../../core/components/landing/Hero';
import About from '../../../core/components/landing/About';
import Mission from '../../../core/components/landing/Mission';
import WhoCanApply from '../../../core/components/landing/WhoCanApply';
import HowItWorks from '../../../core/components/landing/HowItWorks';
import Committees from '../../../core/components/landing/Committees';
import Benefits from '../../../core/components/landing/Benefits';
import Commitment from '../../../core/components/landing/Commitment';
import Apply from '../../../core/components/landing/Apply';
import Footer from '../../../core/components/landing/Footer';

import { useEffect } from 'react';

export default function LandingPage() {
    useEffect(() => {
        const handleSmoothScroll = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const link = target.closest('a');

            if (link && link.hash && link.hash.startsWith('#') && link.origin === window.location.origin) {
                e.preventDefault();
                const element = document.querySelector(link.hash);
                if (element) {
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                    // Optionally update URL hash without jumping
                    history.pushState(null, '', link.hash);
                }
            }
        };

        document.addEventListener('click', handleSmoothScroll);
        return () => document.removeEventListener('click', handleSmoothScroll);
    }, []);

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
    );
}
