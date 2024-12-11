import React, { useState, useEffect } from 'react';
import Groq from 'groq-sdk';
import { useNavigate } from 'react-router-dom';
import { addStory } from '../firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const groq = new Groq({ apiKey: process.env.REACT_APP_GROQCLOUD_API_KEY, dangerouslyAllowBrowser: true });

const Suggestions = () => {
  const [storyText, setStoryText] = useState('');
  const [aiSuggestions, setAISuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const auth = getAuth();
  const [user, setUser] = useState(null); // State for user details
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
}, [auth]);

useEffect(() => {
  document.title = "AI Tools | AIPS";
}, []);

  const fetchAISuggestions = async () => {
    if (!storyText.trim()) {
      alert('Please write some text to get AI suggestions.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a creative assistant. Generate three creative story ideas based on the user's input. Don't include your opening sentences. Format each idea in this structure:
              **Title**
              Description`
          },
          {
            role: 'user',
            content: `${storyText}`
          },
        ],
        model: 'llama3-8b-8192',
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
      const newStory = {
        title: suggestion.title,
        description: suggestion.description,
        chapters: [{ title: 'Prologue', content: '' }],
        characters: [], // Empty characters list initially
        userId: user.uid, // Associate the story with the logged-in user
        createdAt: new Date(),
      };

      const savedStory = await addStory(newStory);
      navigate(`/story/edit/${savedStory.id}`); // Redirect to the edit page for the new story
    } catch (error) {
      console.error('Error creating new story:', error);
      alert('Failed to create a new story. Please try again.');
    }
  };

  return (
    <div className="p-10 mt-16">
      <h1 className="text-2xl font-bold">AI Suggestions</h1>
      <textarea
        value={storyText}
        onChange={(e) => setStoryText(e.target.value)}
        className="w-full h-40 p-2 border mt-4"
        placeholder="Start writing your prompt..."
      ></textarea>
      <button
        onClick={fetchAISuggestions}
        className="bg-blue-500 text-white p-2 mt-4"
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Get AI Suggestions'}
      </button>
      <div className="mt-4">
        <h2 className="font-bold">AI Suggestions:</h2>
        {error && <p className="text-red-500">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {aiSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="border rounded-lg shadow-md p-4 bg-gray-50"
            >
              <h3 className="text-lg font-bold mb-2">{suggestion.title}</h3>
              <p>{suggestion.description}</p>
              <button
                onClick={() => handleCreateNewStory(suggestion)}
                className="bg-green-500 text-white p-2 mt-2 w-full"
              >
                Create New Story
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Suggestions;
