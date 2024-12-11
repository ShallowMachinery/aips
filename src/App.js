import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './components/Dashboard';
import Suggestions from './components/Suggestions';
import StoryEditorPage from './pages/StoryEditorPage';
import Login from './pages/LoginPage';
import Register from './pages/RegisterPage';
import TermsAndConditions from './pages/TermsAndConditions';

function App() {
  return (
    <Router>
    <Navbar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/stories" element={<Dashboard />} />
      <Route path="/terms" element={<TermsAndConditions />} />
      {/* <Route path="/story/view/:id" element={<StoryPage />} /> */}
      <Route path="/story/edit/:id" element={<StoryEditorPage />} />
      <Route path="/ai-integration" element={<Suggestions />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  </Router>
  );
}

export default App;
