import React, { useState, useEffect } from "react";
import { loginUser } from "../firebase";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [credential, setCredential] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Login | AIPS";
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await loginUser(credential, password);
            alert("Login successful!");
            navigate("/home");
        } catch (error) {
            alert("Login failed: " + error.message);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center mt-20 p-10 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl animate-pulse-neon"></div>
                <div className="absolute bottom-20 right-10 w-80 h-80 bg-neon-purple/10 rounded-full blur-3xl animate-pulse-neon" style={{animationDelay: '1s'}}></div>
            </div>

            <div className="relative z-10 w-full max-w-md">
                <div className="glass-strong p-10 rounded-2xl shadow-2xl border border-neon-blue/30 animate-slide-up">
                    <h1 className="text-4xl font-bold mb-2 text-center font-['Orbitron'] gradient-text mb-8">Login</h1>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <input
                                type="text"
                                value={credential}
                                onChange={(e) => setCredential(e.target.value)}
                                placeholder="Email or Username"
                                className="w-full p-4 bg-cyber-blue/50 border border-neon-blue/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 transition-all duration-300"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full p-4 bg-cyber-blue/50 border border-neon-blue/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 transition-all duration-300"
                            />
                        </div>
                        <button 
                            type="submit"
                            className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white p-4 rounded-lg font-semibold hover:from-cyan-400 hover:to-purple-500 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-neon-blue/50"
                        >
                            Login
                        </button>
                    </form>
                    <p className="text-sm mt-6 text-center text-gray-400">
                        Don't have an account?{' '}
                        <a href="/register" className="text-neon-blue hover:text-neon-purple transition-colors duration-300 font-semibold">
                            Register here
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
