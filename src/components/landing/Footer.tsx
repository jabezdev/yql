import { Container, GeometricPattern } from '../ui';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-brand-blueDark text-white pt-12 pb-0 overflow-hidden relative">
            <Container className="mb-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    {/* Brand */}
                    <div className="text-center md:text-left">
                        <a href="#" className="text-xl font-bold text-white mb-2 inline-block font-sans">
                            Young Quantum Leaders Program
                        </a>
                        <p className="text-brand-blueLight/80 text-sm max-w-md">
                            Empowering the next generation of quantum leaders in the Philippines.
                        </p>
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
