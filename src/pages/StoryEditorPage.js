import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { updateStory, getStoryById, getUserData, createAIThread, addMessageToThread, getAIThreadByStory, deleteThread } from '../firebase';
import Groq from 'groq-sdk';
import { FaEdit, FaSave, FaTrash, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import AIThreadViewer from '../components/AIThreadViewer';

const groq = new Groq({ apiKey: process.env.REACT_APP_GROQCLOUD_API_KEY, dangerouslyAllowBrowser: true });

const StoryEditorPage = () => {
  const auth = getAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [storyDetails, setStoryDetails] = useState({
    title: '',
    description: '',
    author: '',
    dateStarted: new Date().toISOString().split('T')[0],
    genre: '',
    location: '',
  });
  const [chapters, setChapters] = useState([
    { title: 'Prologue', content: 'This is the prologue.' },
    { title: 'Chapter 1', content: 'This is chapter 1.' },
  ]);
  const [selectedChapterContent, setSelectedChapterContent] = useState(chapters[0]?.content || '');
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);
  const [selectedChapterTitle, setSelectedChapterTitle] = useState(chapters[0]?.title || '');
  const [characters, setCharacters] = useState([
    { name: "Character", description: "Description for a character" },
  ]);
  const [expandedSections, setExpandedSections] = useState({
    chapters: true,
    characters: true,
    settings: true,
  });

  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [savingStory, setSavingStory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingChapterIndex, setEditingChapterIndex] = useState(null);
  const [editedChapterTitle, setEditedChapterTitle] = useState('');
  const [editingCharacterIndex, setEditingCharacterIndex] = useState(null);
  const [editedCharacterName, setEditedCharacterName] = useState('');
  const [editedCharacterDescription, setEditedCharacterDescription] = useState('');
  const [error, setError] = useState(null);
  const [aiThreadId, setAiThreadId] = useState(null);
  const [refreshThread, setRefreshThread] = useState(false);
  const [thread, setThread] = useState(null);
  const [user, setUser] = useState(null);
  const [includeMainDetails, setIncludeMainDetails] = useState(false);
  const [includeCharacters, setIncludeCharacters] = useState(false);
  const [includeChapters, setIncludeChapters] = useState(false);

  useEffect(() => {
    // Get the currently logged-in user
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userData = await getUserData(currentUser.uid);
        setUser(userData);
        const authorFullName = `${userData.firstName} ${userData.lastName}`;
        setStoryDetails(prev => ({
          ...prev,
          author: authorFullName, // Automatically set author to user's full name
        }));
      } else {
        navigate("/login"); // Redirect to login if no user is signed in
      }
    });
  }, [auth, navigate]);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const story = await getStoryById(id); // Fetch the story using the ID from URL
        if (story) {
          setStoryDetails(story);
          setChapters(story.chapters || []);
          setCharacters(story.characters || []);
          setSelectedChapterContent(story.chapters?.[0]?.content || ''); // Set content of the first chapter
          setSelectedChapterTitle(story.chapters?.[0]?.title || ''); // Set title of the first chapter
          if (!story.threadId) {
            setAiThreadId(null);
          } else {
            setAiThreadId(story.threadId);
          }
        } else {
          alert('Story not found');
          navigate('/stories'); // Redirect to dashboard if story doesn't exist
        }
      } catch (error) {
        console.error('Error fetching story:', error);
      }
    };
    fetchStory();
  }, [id, navigate]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStoryDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const toggleSection = (section) => {
    setExpandedSections((prevSections) => ({
      ...prevSections,
      [section]: !prevSections[section],
    }));
  };

  const addChapter = () => {
    const newChapter = { title: 'New Chapter', content: '' };
    setChapters([...chapters, newChapter]);
  };

  const deleteChapter = (index) => {
    const newChapters = chapters.filter((_, idx) => idx !== index);
    setChapters(newChapters);
  };

  // Add a character to the story
  const addCharacter = () => {
    const newCharacter = { name: 'Character', description: '' };
    setCharacters([...characters, newCharacter]);
  };

  // Delete a character from the story
  const deleteCharacter = (index) => {
    const newCharacters = characters.filter((_, idx) => idx !== index); // Remove character at the given index
    setCharacters(newCharacters); // Update the state with the new list of characters
  };

  const moveChapterUp = (index) => {
    const updatedChapters = [...chapters];
    const temp = updatedChapters[index];
    updatedChapters[index] = updatedChapters[index - 1];
    updatedChapters[index - 1] = temp;
    setChapters(updatedChapters);
  };

  // Move a chapter down
  const moveChapterDown = (index) => {
    const updatedChapters = [...chapters];
    const temp = updatedChapters[index];
    updatedChapters[index] = updatedChapters[index + 1];
    updatedChapters[index + 1] = temp;
    setChapters(updatedChapters);
  };

  const handleChapterClick = (index) => {
    setSelectedChapterTitle(chapters[index].title); // Set the title of the clicked chapter
    setSelectedChapterContent(chapters[index].content); // Set the content of the clicked chapter
    setSelectedChapterIndex(index); // Track the selected chapter
  };

  const handleTitleInputChange = (e) => {
    setEditedChapterTitle(e.target.value);
  };

  const handleCharacterInputChange = (e) => {
    setEditedCharacterName(e.target.value);
  };

  const saveEditedChapterTitle = (index) => {
    const updatedChapters = [...chapters];
    updatedChapters[index].title = editedChapterTitle; // Update title for the selected chapter
    setChapters(updatedChapters); // Save updated chapters
    setEditingChapterIndex(null); // Stop editing
  };

  const handleChapterContentChange = (e) => {
    const updatedContent = e.target.value;
    setSelectedChapterContent(updatedContent); // Update content in the text area
    const updatedChapters = [...chapters];
    updatedChapters[selectedChapterIndex].content = updatedContent; // Update the selected chapter's content
    setChapters(updatedChapters); // Update chapters in the state
  };

  // Save the edited character
  const saveEditedCharacter = (index) => {
    const updatedCharacters = [...characters];
    updatedCharacters[index].name = editedCharacterName;
    updatedCharacters[index].description = editedCharacterDescription;
    setCharacters(updatedCharacters);
    setEditingCharacterIndex(null); // Stop editing
  };

  const handleQueryChange = (e) => {
    setSuggestionQuery(e.target.value);
  };

  const handleCheckboxChange = (setFunction) => (e) => {
    setFunction(e.target.checked);
  };

  const deleteAIThread = async (threadId, id) => {
    console.log("Thread ID: ", threadId);
    console.log("Story ID:", id);
    if (!threadId) {
      console.error("No thread ID provided for deletion.");
      return;
    }
    if (!id) {
      console.error("No story ID for provided for AI Thread deletion.");
      return;
    }
    const userConfirmed = window.confirm("Are you sure you want to delete this thread?");
    if (!userConfirmed) return;
  
    try {
      await deleteThread(threadId, id); // Call to delete the thread in Firebase
      console.log("Thread successfully deleted.");
      setAiThreadId(null); // Clear thread ID
  
      // Toggle refreshThread to signal re-render
      setRefreshThread((prev) => {
        console.log("Previous refreshThread:", prev);
        return !prev;
      });
    } catch (error) {
      console.error("Error deleting thread:", error);
    }
  };

  const requestAISuggestions = async () => {
    if (!suggestionQuery.trim()) {
      alert('Please enter a query for suggestions.');
      return;
    }

    setLoading(true);
    setError(null);

    let systemMessage = `You are an AI assistant helping with story writing. The user has requested:\n\n"${suggestionQuery}".`;
    if (includeMainDetails) {
      systemMessage += `\n\nHere is the story's main title and description:\n"${storyDetails.title}"\n"${storyDetails.description}"`;
    }
    if (includeCharacters && characters?.length > 0) {
      const characterList = characters.map((char) => `- ${char.name}: ${char.description || "No description provided"}`).join('\n');
      systemMessage += `\n\nHere are the characters:\n${characterList}`;
    }
    if (includeChapters && chapters?.length > 0) {
      const previousChapters = chapters.map((ch, idx) => `Chapter ${idx + 1}: ${ch.title}\n${ch.content}`).join('\n\n');
      systemMessage += `\n\nHere are the previous chapters:\n${previousChapters}`;
    }

    try {
      console.log("System message to AI:", systemMessage);
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemMessage,
          },
          {
            role: 'user',
            content: suggestionQuery,
          },
        ],
        model: 'llama3-8b-8192',
      });

      const rawSuggestions = response.choices[0]?.message?.content || '';

      const userId = auth.currentUser.uid;
      const existingThreadId = await getAIThreadByStory(id);

      let threadId;
      if (existingThreadId) {
        threadId = existingThreadId;
      } else {
        threadId = await createAIThread(userId, id);
      }

      await addMessageToThread(threadId, {
        role: 'user',
        content: suggestionQuery,
        includedDetails: [
          includeMainDetails ? "Main details" : "",
          includeCharacters ? "Characters" : "",
          includeChapters ? "Chapters" : ""
        ]
          .filter(Boolean)
          .join(", "),
        createdAt: new Date(),
      });

      await addMessageToThread(threadId, {
        role: 'ai',
        content: rawSuggestions,
        createdAt: new Date(),
      });

      setAiThreadId(threadId);
 
      setRefreshThread((prev) => {
        console.log("Previous refreshThread:", prev);
        return !prev;
      });

      setSuggestionQuery('');

    } catch (err) {
      console.error('Error fetching AI suggestions:', err.response || err.message);
      setError('Failed to fetch suggestions. Please try again.');
    } finally {
      setLoading(false); // Stop loading after the response
    }
  };

  // Handle form submission
  const handleSaveStory = async (e) => {
    e.preventDefault();
    if (!storyDetails.title || !storyDetails.description || chapters.length === 0) {
      alert('Please fill in all fields and ensure there is at least one chapter.');
      return;
    }
    setSavingStory(true);

    try {
      // Prepare the story payload
      const storyPayload = {
        ...storyDetails,
        chapters, // Include all chapters
        characters, // Include all characters
        updatedAt: new Date(),
      };

      await updateStory(id, storyPayload);

      // Reset the form and navigate back to Dashboard
      setStoryDetails({
        title: '',
        description: '',
        author: '',
        dateStarted: new Date().toISOString().split('T')[0],
        genre: '',
        location: '',
      });
      setChapters([{ title: 'Prologue', content: '' }]); // Reset chapters to default
      setCharacters([]); // Reset characters
      setSelectedChapterContent('');
      navigate('/stories'); // Redirect back to Dashboard
    } catch (error) {
      console.error('Error saving story:', error);
      alert('There was an error saving your story. Please try again.');
    } finally {
      setSavingStory(false); // Hide loading state
    }
  };

  return (
    <div className="p-6 mt-16 flex">
      {/* Left side: Story Details and Chapters */}
      <div className="w-1/3 p-4 border mr-4" style={{ height: "calc(100vh - 120px)", overflowY: "auto", resize: "horizontal" }}>
        <h2 className="text-xl font-bold">Story Details</h2>
        <form>
          <label className="block mt-2">Title</label>
          <input
            type="text"
            name="title"
            value={storyDetails.title}
            onChange={handleInputChange}
            className="w-full p-2 mt-1 border"
            placeholder="Story Title"
          />
          <label className="block mt-2">Author</label>
          <input
            type="text"
            name="author"
            value={storyDetails.author}
            onChange={handleInputChange}
            className="w-full p-2 mt-1 border"
            placeholder="Author Name"
          />
          <label className="block mt-2">Description</label>
          <textarea
            name="description"
            value={storyDetails.description}
            onChange={handleInputChange}
            className="w-full p-2 mt-1 border overflow-y-auto h-48 max-h-48"
            placeholder="Story Description"
          />
          <label className="block mt-2">Date Started</label>
          <input
            type="date"
            name="dateStarted"
            value={storyDetails.dateStarted} // Use today's date by default
            onChange={handleInputChange}
            className="w-full p-2 mt-1 border"
          />
          <label className="block mt-2">Genre</label>
          <input
            type="text"
            name="genre"
            value={storyDetails.genre}
            onChange={handleInputChange}
            className="w-full p-2 mt-1 border"
            placeholder="Genre"
          />
          <label className="block mt-2">Location</label>
          <input
            type="text"
            name="location"
            value={storyDetails.location}
            onChange={handleInputChange}
            className="w-full p-2 mt-1 border"
            placeholder="Location (e.g., Forest, Space)"
          />
        </form>

        {/* Chapters Section */}
        <div className="mt-4">
          <button onClick={() => toggleSection('chapters')} className="text-blue-500">
            {expandedSections.chapters ? 'Hide Chapters' : 'Show Chapters'}
          </button>
          {expandedSections.chapters && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Chapters</h3>
              {chapters.map((chapter, index) => (
                <div key={index} className="mt-2 p-2 border rounded-md flex justify-between items-center" style={{ cursor: "pointer" }} onClick={() => handleChapterClick(index)}>
                  {/* Chapter Title (Editable or Read-Only) */}
                  {editingChapterIndex === index ? (
                    <input
                      type="text"
                      value={editedChapterTitle}
                      onChange={handleTitleInputChange}
                      onBlur={() => saveEditedChapterTitle(index)} // Save on blur (when focus leaves the input)
                      className="w-full p-2 border rounded-md"
                      placeholder="Chapter Title"
                    />
                  ) : (
                    <h4 className="font-bold">{chapter.title}</h4>
                  )}

                  {/* Buttons: Edit Chapter Title and Delete Chapter */}
                  <div className="flex space-x-2">
                    {/* Move Up Button */}
                    {index > 0 && (
                      <button
                        onClick={() => moveChapterUp(index)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <FaArrowUp /> {/* Up Icon */}
                      </button>
                    )}

                    {/* Move Down Button */}
                    {index < chapters.length - 1 && (
                      <button
                        onClick={() => moveChapterDown(index)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <FaArrowDown /> {/* Down Icon */}
                      </button>
                    )}

                    {editingChapterIndex === index ? (
                      <button
                        onClick={() => {
                          saveEditedChapterTitle(index); // Save the edited title
                        }}
                        className="text-green-500 hover:text-green-700"
                      >
                        <FaSave /> {/* Save Icon */}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingChapterIndex(index); // Set the chapter index to start editing
                          setEditedChapterTitle(chapter.title); // Set the initial value to the chapter's current title
                        }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <FaEdit /> {/* Edit Icon */}
                      </button>
                    )}

                    {/* Delete Chapter Button */}
                    <button
                      onClick={() => deleteChapter(index)} // Pass index to deleteChapter function
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash /> {/* Trash Icon */}
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={addChapter} className="bg-green-500 text-white p-2 mt-2">
                Add Chapter
              </button>
            </div>
          )}
        </div>

        {/* Characters Section */}
        <div className="mt-4">
          <button onClick={() => toggleSection('characters')} className="text-blue-500">
            {expandedSections.characters ? 'Hide Characters' : 'Show Characters'}
          </button>
          {expandedSections.characters && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Characters</h3>
              {characters.map((character, index) => (
                <div key={index} className="mt-2 p-2 border rounded-md">
                  {editingCharacterIndex === index ? (
                    <>
                      {/* Editable Name */}
                      <input
                        type="text"
                        value={editedCharacterName}
                        onChange={(e) => setEditedCharacterName(e.target.value)}
                        onBlur={() => saveEditedCharacter(index)} // Save on blur (optional)
                        className="w-full p-2 mb-2 border rounded-md"
                        placeholder="Character Name"
                      />
                      {/* Editable Description */}
                      <textarea
                        value={editedCharacterDescription}
                        onChange={(e) => setEditedCharacterDescription(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        placeholder="Character Description"
                      />
                    </>
                  ) : (
                    <>
                      {/* Display Character Info */}
                      <h4 className="font-bold">{character.name}</h4>
                      <p className="text-gray-600">{character.description || 'No description provided'}</p>
                    </>
                  )}
                  <div className="flex justify-end space-x-2 mt-2">
                    {editingCharacterIndex === index ? (
                      <button
                        onClick={() => saveEditedCharacter(index)}
                        className="text-green-500 hover:text-green-700"
                      >
                        <FaSave />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingCharacterIndex(index);
                          setEditedCharacterName(character.name);
                          setEditedCharacterDescription(character.description || ''); // Set initial description
                        }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <FaEdit />
                      </button>
                    )}
                    <button
                      onClick={() => deleteCharacter(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={addCharacter}
                className="bg-green-500 text-white p-2 mt-2 w-full rounded"
              >
                Add Character
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white p-2 mt-4 w-full"
          onClick={handleSaveStory}
          disabled={savingStory}
        >
          {savingStory ? 'Saving...' : 'Save Story'}
        </button>
      </div>

      <div className="w-2/6 p-4 border" style={{ resize: "horizontal" }}>
        <h2 className="text-xl font-bold">{selectedChapterTitle}</h2> {/* Dynamically update h2 title */}
        <textarea
          value={selectedChapterContent}
          onChange={handleChapterContentChange}
          className="w-full h-96 p-2 mt-1 border"
          placeholder="Write your story here..."
          style={{ height: "calc(100vh - 200px)", overflowY: "auto" }}
        />
      </div>

      <div className="w-1/3 p-4 border ml-4" style={{ height: "calc(100vh - 120px)", overflowY: "auto", resize: "horizontal" }}>
        <div className="flex">
          <h2 className="text-xl font-bold ml-0">Chat with AIPS</h2>
          {aiThreadId != null && <button
            onClick={() => deleteAIThread(aiThreadId, id)}
            className="text-red-500 hover:text-red-700 ml-auto"
          >
            Delete Thread
          </button>}
        </div>
        <AIThreadViewer threadId={aiThreadId} refreshThread={refreshThread} />
        {/* User Query Input for AI Suggestions */}
        <div className="mt-4 relative">
          <textarea
            value={suggestionQuery}
            onChange={handleQueryChange}
            className="w-full p-2 border mb-4 min-h-24"
            placeholder="Ask me for help! (e.g., plot ideas, character names)"
          />
          <button
            onClick={requestAISuggestions}
            className={`absolute bottom-2 right-2 bg-blue-500 text-white px-4 py-2 rounded ${loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            disabled={loading}
          >
            {loading ? 'AIPS is thinking...' : 'Send'}
          </button>
          {/* Collapsible section for "Add story details" */}
          <div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="include-main-details"
                className="mr-2"
                checked={includeMainDetails}
                onChange={handleCheckboxChange(setIncludeMainDetails)}
              />
              <label htmlFor="include-main-details">Include main story details (title and description)</label>
            </div>
            <div className="flex items-center mb-2">
              <input type="checkbox" id="include-characters" className="mr-2"
                checked={includeCharacters}
                onChange={handleCheckboxChange(setIncludeCharacters)} />
              <label htmlFor="include-characters">Include current characters</label>
            </div>
            <div className="flex items-center mb-2">
              <input type="checkbox" id="include-chapters" className="mr-2"
                checked={includeChapters}
                onChange={handleCheckboxChange(setIncludeChapters)} />
              <label htmlFor="include-chapters">Look back to previous chapters</label>
            </div>
          </div>

          {/* Error Display */}
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default StoryEditorPage;
