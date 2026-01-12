import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {

    useEffect(() => {
        document.title = "AIPS: AI-Powered Storytelling";
    }, []);

    return (
        <div className="min-h-screen mt-20 p-10 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-neon-blue/10 rounded-full blur-3xl animate-pulse-neon"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-pulse-neon" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-neon-pink/10 rounded-full blur-3xl animate-pulse-neon" style={{animationDelay: '2s'}}></div>
            </div>

            <div className="relative z-10">
                {/* Hero Section */}
                <header className="glass p-12 rounded-2xl shadow-2xl mb-16 border border-neon-blue/30 animate-slide-up">
                    <h1 className="text-6xl font-bold mb-4 text-center font-['Orbitron'] gradient-text animate-fade-in">
                        AI-Powered Storytelling
                    </h1>
                    <p className="text-xl text-center text-gray-300 max-w-3xl mx-auto leading-relaxed animate-fade-in" style={{animationDelay: '0.2s'}}>
                        Empower your creativity with AI. Create, develop, and enhance your stories with cutting-edge AI tools designed for writers.
                    </p>
                    <div className="flex justify-center mt-8 animate-fade-in" style={{animationDelay: '0.4s'}}>
                        <div className="w-32 h-1 bg-gradient-to-r from-transparent via-neon-blue to-transparent"></div>
                    </div>
                </header>

                {/* Features Section */}
                <section className="mt-16">
                    <h2 className="text-4xl font-bold mb-12 text-center font-['Orbitron'] gradient-text">What We Offer</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="glass p-8 rounded-xl shadow-xl border border-green-500/20 hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 group animate-slide-up">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <span className="text-2xl">🌐</span>
                            </div>
                            <h3 className="text-2xl font-bold text-green-400 mb-3 font-['Orbitron']">Public Library</h3>
                            <p className="text-gray-300 mb-6 leading-relaxed">
                                Discover and read stories shared by the community. Explore a collection of public stories from talented writers.
                            </p>
                            <Link
                                to="/library"
                                className="inline-flex items-center gap-2 text-green-400 hover:text-emerald-400 transition-all duration-300 font-semibold group-hover:gap-4"
                            >
                                Browse Library <span className="text-xl">→</span>
                            </Link>
                        </div>
                        <div className="glass p-8 rounded-xl shadow-xl border border-neon-blue/20 hover:border-neon-blue/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-neon-blue/20 group animate-slide-up">
                            <div className="w-16 h-16 bg-gradient-to-br from-neon-blue to-neon-purple rounded-lg mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <span className="text-2xl">📚</span>
                            </div>
                            <h3 className="text-2xl font-bold text-neon-blue mb-3 font-['Orbitron']">Story Dashboard</h3>
                            <p className="text-gray-300 mb-6 leading-relaxed">
                                Manage your stories seamlessly. View, create, edit, and delete your stories all in one place.
                            </p>
                            <Link
                                to="/stories"
                                className="inline-flex items-center gap-2 text-neon-blue hover:text-neon-purple transition-all duration-300 font-semibold group-hover:gap-4"
                            >
                                Explore Dashboard <span className="text-xl">→</span>
                            </Link>
                        </div>

                        <div className="glass p-8 rounded-xl shadow-xl border border-neon-purple/20 hover:border-neon-purple/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-neon-purple/20 group animate-slide-up" style={{animationDelay: '0.1s'}}>
                            <div className="w-16 h-16 bg-gradient-to-br from-neon-purple to-neon-pink rounded-lg mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <span className="text-2xl">👤</span>
                            </div>
                            <h3 className="text-2xl font-bold text-neon-purple mb-3 font-['Orbitron']">Character Development</h3>
                            <p className="text-gray-300 mb-6 leading-relaxed">
                                Create compelling characters for your stories with our AI-driven tool to keep your readers hooked.
                            </p>
                            <Link
                                to="/characterlibrary"
                                className="inline-flex items-center gap-2 text-neon-purple hover:text-neon-pink transition-all duration-300 font-semibold group-hover:gap-4"
                            >
                                Start Developing <span className="text-xl">→</span>
                            </Link>
                        </div>

                        <div className="glass p-8 rounded-xl shadow-xl border border-neon-pink/20 hover:border-neon-pink/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-neon-pink/20 group animate-slide-up" style={{animationDelay: '0.2s'}}>
                            <div className="w-16 h-16 bg-gradient-to-br from-neon-pink to-neon-blue rounded-lg mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <span className="text-2xl">✨</span>
                            </div>
                            <h3 className="text-2xl font-bold text-neon-pink mb-3 font-['Orbitron']">Create with AIPS!</h3>
                            <p className="text-gray-300 mb-6 leading-relaxed">
                                Generate one-shot ideas, brainstorm scenes, or get suggestions to enhance your creative writing process.
                            </p>
                            <Link
                                to="/ai-integration"
                                className="inline-flex items-center gap-2 text-neon-pink hover:text-neon-blue transition-all duration-300 font-semibold group-hover:gap-4"
                            >
                                Try AIPS <span className="text-xl">→</span>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="mt-20 mb-10 glass p-6 rounded-xl border border-neon-blue/20">
                    <div className="flex flex-wrap justify-center items-center gap-4 text-sm text-gray-400">
                        <p>&copy; 2024 AI Storytelling. All rights reserved.</p>
                        <span className="text-neon-blue">|</span>
                        <Link to="/terms" className="hover:text-neon-blue transition-colors duration-300">
                            Terms of Service
                        </Link>
                        <span className="text-neon-blue">|</span>
                        <p className="text-center">Balancing Human Creativity with AI Capabilities</p>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Home;
