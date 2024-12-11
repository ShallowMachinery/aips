import React, { useState } from "react";
import { loginUser } from "../firebase";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [credential, setCredential] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

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
        <div className="min-h-screen flex flex-col justify-center items-center">
            <h1 className="text-3xl font-bold mb-4">Login</h1>
            <form onSubmit={handleLogin} className="w-80">
                <input
                    type="text"
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    placeholder="Email or Username"
                    className="w-full p-3 mb-3 border rounded"
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full p-3 mb-3 border rounded"
                />
                <button className="bg-blue-500 text-white p-3 w-full rounded">Login</button>
            </form>
            <p className="text-sm mt-2">Don't have an account? <a href="/register" className="text-blue-500 hover:text-blue-700">Register here</a></p>
        </div>
    );
};

export default Login;
