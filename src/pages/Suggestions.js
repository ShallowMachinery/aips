import React, { useState, useEffect } from 'react';
import Groq from 'groq-sdk';
import { useNavigate } from 'react-router-dom';
import { addStory, getUserData } from '../firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const groq = new Groq({ apiKey: process.env.REACT_APP_GROQCLOUD_API_KEY, dangerouslyAllowBrowser: true });

const Suggestions = () => {
  const [storyText, setStoryText] = useState('');
  const [aiSuggestions, setAISuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const auth = getAuth();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    document.title = "Create with AIPS! | AIPS";
  }, []);

  const fetchAISuggestions = async () => {
    if (!storyText.trim()) {
      alert('Please write some text to let AIPS help you here!');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a creative assistant. Generate three story ideas based on the user's input. Don't include your opening sentences. Format each idea in this structure:
              **Title**
              Description`
          },
          {
            role: 'user',
            content: `${storyText}`
          },
        ],
        model: 'openai/gpt-oss-120b',
      });

      const rawSuggestions = response.choices[0]?.message?.content || '';

      const suggestions = rawSuggestions
        .split(/\n(?=\*\*[^*]+?\*\*)/)
        .map((entry) => {
          const match = entry.match(/\*\*(.+?)\*\*\s*(.+)/);
          return match ? { title: match[1].trim(), description: match[2].trim() } : null;
        })
        .filter(Boolean);

      setAISuggestions(suggestions);
    } catch (err) {
      console.error('Error fetching AI suggestions:', err.response || err.message);
      setError('Failed to fetch suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewStory = async (suggestion) => {
    try {
      // Get user data to set author name
      let authorName = user.email || 'Unknown Author';
      try {
        const userData = await getUserData(user.uid);
        if (userData && userData.firstName && userData.lastName) {
          authorName = `${userData.firstName} ${userData.lastName}`;
        }
      } catch (err) {
        console.log('Could not fetch user data, using email as author');
      }

      const newStory = {
        title: suggestion.title,
        description: suggestion.description,
        author: authorName,
        chapters: [{ title: 'Prologue', content: '' }],
        characters: [],
        userId: user.uid,
        createdAt: new Date(),
      };

      const savedStory = await addStory(newStory);
      navigate(`/story/edit/${savedStory.id}`);
    } catch (error) {
      console.error('Error creating new story:', error);
      alert('Failed to create a new story. Please try again.');
    }
  };

  return (
    <div className="p-10 mt-20 min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl animate-pulse-neon"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-neon-purple/10 rounded-full blur-3xl animate-pulse-neon" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-neon-pink/10 rounded-full blur-3xl animate-pulse-neon" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-8 font-['Orbitron'] gradient-text text-center animate-fade-in">Create with AIPS!</h1>
        
        <div className="glass-strong p-8 rounded-xl border border-neon-blue/30 shadow-2xl mb-8 animate-slide-up">
          <textarea
            value={storyText}
            onChange={(e) => setStoryText(e.target.value)}
            className="w-full h-40 p-4 bg-cyber-blue/50 border border-neon-blue/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 transition-all duration-300 resize-none"
            placeholder="Start writing your prompt here... Let AIPS inspire your creativity!"
          ></textarea>
          <button
            onClick={fetchAISuggestions}
            className="mt-4 w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white p-4 rounded-lg font-semibold hover:from-cyan-400 hover:to-purple-500 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-neon-blue/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                AIPS is thinking...
              </span>
            ) : (
              '✨ Send to AIPS! ✨'
            )}
          </button>
        </div>

        <div className="mt-8">
          <h2 className="text-3xl font-bold mb-6 font-['Orbitron'] gradient-text">AIPS Suggestions:</h2>
          {error && (
            <div className="glass p-4 rounded-xl border border-red-500/30 mb-6">
              <p className="text-red-400">{error}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="glass p-6 rounded-xl border border-neon-purple/20 hover:border-neon-purple/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-neon-purple/20 group animate-slide-up"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <h3 className="text-xl font-bold mb-3 text-neon-purple font-['Orbitron'] group-hover:text-neon-pink transition-colors duration-300">
                  {suggestion.title}
                </h3>
                <p className="text-gray-300 mb-4 leading-relaxed">{suggestion.description}</p>
                <button
                  onClick={() => handleCreateNewStory(suggestion)}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 rounded-lg font-semibold hover:from-green-400 hover:to-emerald-400 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/50"
                >
                  Create New Story
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Suggestions;
