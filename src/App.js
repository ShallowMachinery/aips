import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Suggestions from './pages/Suggestions';
import Library from './pages/Library';
import StoryPage from './pages/StoryPage';
import StoryEditorPage from './pages/StoryEditorPage';
import Login from './pages/LoginPage';
import Register from './pages/RegisterPage';
import TermsAndConditions from './pages/TermsAndConditions';
import PublicLibrary from './pages/PublicLibrary';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/stories" element={<Dashboard />} />
          <Route path="/library" element={<PublicLibrary />} />
          <Route path="/characterlibrary" element={<Library />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/story/read/:id" element={<StoryPage />} />
          <Route path="/story/edit/:id" element={<StoryEditorPage />} />
          <Route path="/ai-integration" element={<Suggestions />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
