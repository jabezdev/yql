import { Container, GeometricPattern } from '../ui';
import { Mail, Globe, Linkedin, Facebook } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-brand-blueDark text-white pt-12 pb-0 overflow-hidden relative">
            <Container className="mb-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-12">
                    {/* Brand */}
                    <div className="flex flex-col items-start text-left max-w-xl">
                        <img src="/YQL_LOGO_WHITE.svg" alt="YQL Logo" className="h-32 w-auto mb-6" />
                        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2">
                            Young Quantum Leaders Program
                        </h2>
                        <p className="text-brand-blueLight/90 text-base md:text-lg font-medium">
                            Empowering the next generation of quantum leaders in the Philippines.
                        </p>
                    </div>

                    {/* Links */}
                    <div className="flex flex-col gap-4 text-white/80 mt-4 md:mt-0">
                        <a href="mailto:hr@qcsp.ph" className="flex items-center gap-3 hover:text-white transition-colors">
                            <Mail className="w-5 h-5" />
                            <span>hr@qcsp.ph</span>
                        </a>
                        <a href="https://qcsp.ph" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-white transition-colors">
                            <Globe className="w-5 h-5" />
                            <span>qcsp.ph</span>
                        </a>
                        <a href="https://linkedin.com/company/qcsp" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-white transition-colors">
                            <Linkedin className="w-5 h-5" />
                            <span>/company/qcsp</span>
                        </a>
                        <a href="https://fb.com/qcsp.ph" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-white transition-colors">
                            <Facebook className="w-5 h-5" />
                            <span>/qcsp.ph</span>
                        </a>
                    </div>
                </div>

                {/* Bottom Bar: Copyright Only */}
                <div className="mt-8 pt-8 border-t border-white/10 text-center">
                    <p className="text-sm font-medium text-white/60">
                        © {currentYear} Quantum Computing Society of the Philippines. All rights reserved.
                    </p>
                </div>
            </Container>

            {/* Continuous Geometric Footer Strip */}
            <div className="w-full mt-auto opacity-80">
                <GeometricPattern variant="footer-strip" size={60} className="w-full" />
            </div>
        </footer>
    );
}
