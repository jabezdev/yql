import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Container, Button } from '../ui';
import { NAV_LINKS } from '../../constants';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    const closeMenu = () => setIsOpen(false);

    return (
        <nav
            className="fixed w-full z-50 h-[72px] flex items-center bg-white border-b-4 border-brand-blueDark transition-all duration-300"
        >
            <Container className="flex justify-between items-center w-full">
                <a href="#" className="text-sm md:text-xl font-bold text-brand-blueDark">
                    Young Quantum Leaders Program
                </a>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-8">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            className="text-brand-darkBlue hover:text-brand-wine transition-colors text-sm font-medium"
                        >
                            {link.name}
                        </a>
                    ))}
                    <Button
                        as="a"
                        href="#apply"
                        variant="geometric-primary"
                        size="md"
                        className="py-2"
                    >
                        Apply Now
                    </Button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-brand-blueDark"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label={isOpen ? 'Close menu' : 'Open menu'}
                >
                    {isOpen ? <X /> : <Menu />}
                </button>
            </Container>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-white border-t border-gray-200 p-6 flex flex-col space-y-4 shadow-lg">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            className="text-brand-darkBlue hover:text-brand-wine text-lg font-medium"
                            onClick={closeMenu}
                        >
                            {link.name}
                        </a>
                    ))}
                    <Button
                        as="a"
                        href="#apply"
                        fullWidth
                        variant="geometric-primary"
                        size="lg"
                        onClick={closeMenu}
                    >
                        Apply Now
                    </Button>
                </div>
            )}
        </nav>
    );
}
