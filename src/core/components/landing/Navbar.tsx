import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConvexAuth, useQuery } from "convex/react";
import { useClerk } from "@clerk/clerk-react";
import { api } from "../../../../convex/_generated/api";
import { Container, Button } from '../ui';
import { NAV_LINKS } from '../../constants';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated } = useConvexAuth();
    const { signOut } = useClerk();
    // Fetch user to check role
    const user = useQuery(api.core.users.getMe);
    // Determine target path

    // const buttonLabel = user?.systemRole === 'admin' ? 'Admin Panel' : 'Sign Out';

    const handleAuthClick = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (user?.systemRole === 'admin') {
            navigate('/dashboard/admin');
        } else {
            // Guests just sign out for now since dashboard is closed
            signOut();
        }
    };

    const closeMenu = () => setIsOpen(false);

    return (
        <nav
            className="fixed w-full z-50 h-[72px] flex items-center bg-white border-b-4 border-brand-blueDark transition-all duration-300"
        >
            <Container className="flex justify-between items-center w-full">
                <a href="#" className="flex items-center gap-2">
                    <img src="/YQL_LOGO.svg" alt="YQL Logo" className="h-10 w-auto" />
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
                        onClick={handleAuthClick}
                        variant="geometric-primary"
                        size="md"
                        className="py-2"
                    >
                        {isAuthenticated ? 'Dashboard' : 'Log in'}
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
                        fullWidth
                        variant="geometric-primary"
                        size="lg"
                        onClick={() => {
                            closeMenu();
                            handleAuthClick();
                        }}
                    >
                        {isAuthenticated ? 'Dashboard' : 'Log in'}
                    </Button>
                </div>
            )}
        </nav>
    );
}
