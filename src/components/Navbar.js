import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut, getAuth, onAuthStateChanged } from 'firebase/auth';
import { FaBars, FaTimes, FaSun, FaMoon, FaCog } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';

const Navbar = () => {
    const navigate = useNavigate();
    const auth = getAuth();
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, [auth]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
            setIsMobileMenuOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    const handleLinkClick = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <nav className="glass-strong p-3 md:p-4 flex justify-between items-center fixed w-full top-0 z-50 border-b transition-colors duration-300" style={{ borderColor: 'var(--border-primary)' }}>
            <div className="flex items-center">
                <h1 className="text-xl md:text-2xl font-bold font-['Orbitron'] gradient-text">AIPS</h1>
                <span className="ml-1 md:ml-2 text-xs md:text-sm font-['Rajdhani'] hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>AI-Powered Storytelling</span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4 lg:gap-6">
                <Link 
                    to="/" 
                    className="transition-all duration-300 hover:scale-110 font-medium text-sm lg:text-base"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--accent-blue)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                    Home
                </Link>
                <Link 
                    to="/library" 
                    className="transition-all duration-300 hover:scale-110 font-medium text-sm lg:text-base"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--accent-blue)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                    Public Library
                </Link>
                {user && (
                    <>
                        <Link 
                            to="/stories" 
                            className="transition-all duration-300 hover:scale-110 font-medium text-sm lg:text-base"
                            style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={(e) => e.target.style.color = 'var(--accent-blue)'}
                            onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                        >
                            My Stories
                        </Link>
                        <Link 
                            to="/characterlibrary" 
                            className="transition-all duration-300 hover:scale-110 font-medium text-sm lg:text-base"
                            style={{ color: 'var(--text-secondary)' }}
                            onMouseEnter={(e) => e.target.style.color = 'var(--accent-blue)'}
                            onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                        >
                            Character Library
                        </Link>
                    </>
                )}
                <Link 
                    to="/ai-integration" 
                    className="transition-all duration-300 hover:scale-110 font-medium text-sm lg:text-base"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--accent-blue)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                >
                    Create with AIPS
                </Link>
                
                {/* Settings Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className="p-2 rounded-lg transition-all duration-300 hover:scale-110"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={(e) => e.target.style.color = 'var(--accent-blue)'}
                        onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
                        title="Display Settings"
                    >
                        <FaCog size={18} />
                    </button>
                    {isSettingsOpen && (
                        <div className="absolute right-0 mt-2 glass-strong rounded-lg shadow-xl border p-3 min-w-[180px]" style={{ borderColor: 'var(--border-primary)' }}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Theme</span>
                                <button
                                    onClick={toggleTheme}
                                    className="p-2 rounded-lg transition-all duration-300 hover:scale-110"
                                    style={{ color: 'var(--accent-blue)' }}
                                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                                >
                                    {theme === 'light' ? <FaMoon size={16} /> : <FaSun size={16} />}
                                </button>
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                {theme === 'light' ? 'Dark mode' : 'Light mode'}
                            </div>
                        </div>
                    )}
                </div>

                {user ? (
                    <button
                        onClick={handleLogout}
                        className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-4 lg:px-6 py-2 rounded-lg font-semibold hover:from-red-600 hover:to-pink-700 transition-all duration-300 hover:scale-105 hover:shadow-lg text-sm lg:text-base"
                    >
                        Logout
                    </button>
                ) : (
                    <Link
                        to="/login"
                        className="bg-gradient-to-r from-accent-blue to-accent-purple text-white px-4 lg:px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 hover:scale-105 hover:shadow-lg text-sm lg:text-base"
                    >
                        Login
                    </Link>
                )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg transition-all duration-300"
                    style={{ color: 'var(--text-secondary)' }}
                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                >
                    {theme === 'light' ? <FaMoon size={20} /> : <FaSun size={20} />}
                </button>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="transition-colors duration-300 p-2"
                    style={{ color: 'var(--text-secondary)' }}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="absolute top-full left-0 right-0 glass-strong border-b shadow-xl md:hidden" style={{ borderColor: 'var(--border-primary)' }}>
                    <div className="flex flex-col p-4 space-y-3">
                        <Link 
                            to="/" 
                            onClick={handleLinkClick}
                            className="transition-all duration-300 font-medium py-2 border-b"
                            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' }}
                        >
                            Home
                        </Link>
                        <Link 
                            to="/library" 
                            onClick={handleLinkClick}
                            className="transition-all duration-300 font-medium py-2 border-b"
                            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' }}
                        >
                            Public Library
                        </Link>
                        {user && (
                            <>
                                <Link 
                                    to="/stories" 
                                    onClick={handleLinkClick}
                                    className="transition-all duration-300 font-medium py-2 border-b"
                                    style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' }}
                                >
                                    My Stories
                                </Link>
                                <Link 
                                    to="/characterlibrary" 
                                    onClick={handleLinkClick}
                                    className="transition-all duration-300 font-medium py-2 border-b"
                                    style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' }}
                                >
                                    Character Library
                                </Link>
                            </>
                        )}
                        <Link 
                            to="/ai-integration" 
                            onClick={handleLinkClick}
                            className="transition-all duration-300 font-medium py-2 border-b"
                            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' }}
                        >
                            Create with AIPS
                        </Link>
                        {user ? (
                            <button
                                onClick={handleLogout}
                                className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-red-600 hover:to-pink-700 transition-all duration-300 text-left mt-2"
                            >
                                Logout
                            </button>
                        ) : (
                            <Link
                                to="/login"
                                onClick={handleLinkClick}
                                className="bg-gradient-to-r from-accent-blue to-accent-purple text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-all duration-300 text-center mt-2"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            )}
            
            {/* Close settings dropdown when clicking outside */}
            {isSettingsOpen && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsSettingsOpen(false)}
                />
            )}
        </nav>
    );
}

export default Navbar;