import { Container } from '../ui';
import { GeometricPattern } from '../ui';

const SHAPE_SIZE = 80;

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative bg-brand-blueLight/30 text-brand-darkBlue pt-20 pb-0 overflow-hidden">
            <Container className="relative z-10 mb-20">
                <div className="flex flex-col items-start text-left">
                    {/* Brand */}
                    <div className="max-w-2xl">
                        <a href="#" className="text-2xl md:text-3xl font-bold text-brand-blueDark mb-6 inline-block font-sans">
                            Young Quantum Leaders Program
                        </a>
                        <p className="text-lg text-brand-darkBlue/70 leading-relaxed max-w-lg">
                            Empowering the next generation of quantum leaders in the
                            Philippines. Join us in shaping the future.
                        </p>
                    </div>
                </div>

                {/* Bottom Bar: Copyright Only */}
                <div className="mt-16 border-t border-brand-blueDark/10 pt-8 flex text-brand-darkBlue/60">
                    <p className="text-sm font-medium">© {currentYear} Quantum Computing Society of the Philippines. All rights reserved.</p>
                </div>
            </Container>

            {/* Continuous Geometric Footer Strip - The last most part */}
            <div className="w-full mt-auto">
                <GeometricPattern variant="footer-strip" size={SHAPE_SIZE} className="w-full" />
            </div>
        </footer>
    );
}
