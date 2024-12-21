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
    <div className="min-h-screen flex flex-col justify-center items-center mt-10 p-10">
      <h1 className="text-3xl font-bold mb-4">Register</h1>
      <form onSubmit={handleRegister} className="w-80">
        <div className="flex justify-between mb-3">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
            className="w-1/2 p-3 mr-2 border rounded"
          />
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name"
            className="w-1/2 p-3 border rounded"
          />
        </div>
        <input
          type="text"
          value={username}
          onChange={handleUsernameChange}
          placeholder="Username (only alphanumeric characters, underscore, and dashes"
          className="w-full p-3 mb-3 border rounded"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-3 mb-3 border rounded"
        />
        <div className="flex justify-between mb-3">
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Password"
            className="w-1/2 p-3 mr-2 border rounded"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            className="w-1/2 p-3 border rounded"
          />
        </div>
        <div className="flex justify-between mb-3">
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-1/2 p-3 mr-2 border rounded"
          />
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Phone Number"
            className="w-1/2 p-3 border rounded"
          />
        </div>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Short Bio"
          className="w-full p-3 mb-3 border rounded min-h-16"
        />
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mr-2"
          />
          <label>I agree to the <a href="/terms" className="text-blue-500 underline">Terms and Conditions</a></label>
        </div>
        {passwordError && <p className="text-red-500 mb-2">{passwordError}</p>}
        <button className="bg-blue-500 text-white p-3 w-full rounded">Register</button>
      </form>
      <p className="text-sm mt-2">Already have an account? <a href="/login" className="text-blue-500 hover:text-blue-700">Log in here</a></p>
    </div>
  );
};

export default Register;