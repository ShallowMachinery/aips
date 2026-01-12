import React, { useState, useEffect } from "react";
import { registerUser } from "../firebase";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bio, setBio] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Register | AIPS";
}, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (!agreedToTerms) {
      alert("You must agree to the terms and conditions to register.");
      return;
    }
    if (passwordError) {
      alert(passwordError);
      return;
    }
    try {
      await registerUser(email, password, firstName, lastName, username, dateOfBirth, phoneNumber, bio);
      alert("Registration successful!");
      navigate("/home");
    } catch (error) {
      alert("Registration failed: " + error.message);
    }
  };

const handlePasswordChange = (e) => {
  const value = e.target.value;
  const regex = /^.{8,}$/;

  setPassword(value);

  if (!regex.test(value)) {
    setPasswordError("Password must be at least 8 characters long.");
  } else {
    setPasswordError("");
  }
};

  const usernameRegex = /^[a-zA-Z0-9_-]+$/;

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    if (usernameRegex.test(value) || value === '') {
      setUsername(value);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center mt-20 p-10 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-pulse-neon"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-neon-pink/10 rounded-full blur-3xl animate-pulse-neon" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="glass-strong p-10 rounded-2xl shadow-2xl border border-neon-purple/30 animate-slide-up">
          <h1 className="text-4xl font-bold mb-8 text-center font-['Orbitron'] gradient-text">Register</h1>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className="p-4 bg-cyber-blue/50 border border-neon-blue/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 transition-all duration-300"
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className="p-4 bg-cyber-blue/50 border border-neon-blue/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 transition-all duration-300"
              />
            </div>
            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Username (alphanumeric, underscore, dashes only)"
              className="w-full p-4 bg-cyber-blue/50 border border-neon-blue/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 transition-all duration-300"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-4 bg-cyber-blue/50 border border-neon-blue/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 transition-all duration-300"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Password"
                className="p-4 bg-cyber-blue/50 border border-neon-blue/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 transition-all duration-300"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="p-4 bg-cyber-blue/50 border border-neon-blue/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 transition-all duration-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="p-4 bg-cyber-blue/50 border border-neon-blue/30 rounded-lg text-white focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 transition-all duration-300"
              />
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Phone Number"
                className="p-4 bg-cyber-blue/50 border border-neon-blue/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 transition-all duration-300"
              />
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short Bio"
              className="w-full p-4 bg-cyber-blue/50 border border-neon-blue/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 transition-all duration-300 min-h-24 resize-none"
            />
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mr-3 w-5 h-5 accent-neon-blue cursor-pointer"
              />
              <label className="text-gray-300">
                I agree to the{' '}
                <a href="/terms" className="text-neon-blue hover:text-neon-purple transition-colors duration-300 underline">
                  Terms and Conditions
                </a>
              </label>
            </div>
            {passwordError && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                {passwordError}
              </p>
            )}
            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-neon-purple to-neon-pink text-white p-4 rounded-lg font-semibold hover:from-purple-500 hover:to-pink-500 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-neon-purple/50 mt-4"
            >
              Register
            </button>
          </form>
          <p className="text-sm mt-6 text-center text-gray-400">
            Already have an account?{' '}
            <a href="/login" className="text-neon-purple hover:text-neon-pink transition-colors duration-300 font-semibold">
              Log in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;