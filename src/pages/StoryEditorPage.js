import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { updateStory, getStoryById, getUserData, createAIThread, addMessageToThread, getAIThreadByStory, deleteThread, getAIThread } from '../firebase';
import Groq from 'groq-sdk';
import { FaEdit, FaSave, FaTrash, FaArrowUp, FaArrowDown, FaComments, FaTimes, FaPaperPlane, FaBars, FaLightbulb, FaArrowLeft, FaInfo } from 'react-icons/fa';

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
    { title: '', content: '' },
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
  const [includeMainDetails, setIncludeMainDetails] = useState(false);
  const [includeCharacters, setIncludeCharacters] = useState(false);
  const [includeChapters, setIncludeChapters] = useState(false);
  const [lastLoadedChapterEditing, setLastLoadedChapterEditing] = useState(null);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isMoreOptionsVisible, setIsMoreOptionsVisible] = useState(false);
  const moreOptionsRef = useRef(null);

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userData = await getUserData(currentUser.uid);
        const authorFullName = `${userData.firstName} ${userData.lastName}`;
        setStoryDetails(prev => ({
          ...prev,
          author: authorFullName,
        }));
      } else {
        navigate("/login");
      }
    });
  }, [auth, navigate]);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const story = await getStoryById(id);
        if (story) {
          setStoryDetails(story);
          setChapters(story.chapters || []);
          setCharacters(story.characters || []);
          setAiThreadId(story.threadId || null);
  
          if (story.lastLoadedChapterEditing !== undefined) {
            const lastChapterIndex = story.lastLoadedChapterEditing;
            setLastLoadedChapterEditing(lastChapterIndex);
            setSelectedChapterIndex(lastChapterIndex);
            setSelectedChapterTitle(story.chapters?.[lastChapterIndex]?.title || '');
            setSelectedChapterContent(story.chapters?.[lastChapterIndex]?.content || '');
          } else {
            setSelectedChapterTitle(story.chapters?.[0]?.title || '');
            setSelectedChapterContent(story.chapters?.[0]?.content || '');
          }
        } else {
          alert('Story not found');
          navigate('/stories');
        }
      } catch (error) {
        console.error('Error fetching story:', error);
      }
    };
  
    fetchStory();
  }, [id, navigate]);
  
  useEffect(() => {
    if (storyDetails.title) {
      document.title = `Editing ${storyDetails.title} | AIPS`;
    }
  }, [storyDetails.title]);
  

  const saveLastLoadedChapter = (index) => {
    try {
      updateStory(id, { lastLoadedChapterEditing: index });
    } catch (error) {
      console.error('Error saving last loaded chapter:', error);
    }
    return () => {
      if (selectedChapterIndex !== null) {
        saveLastLoadedChapter();
      }
    };
  };

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
    if (window.confirm("Are you sure you want to delete this chapter?")) {
      const newChapters = chapters.filter((_, idx) => idx !== index);
      setChapters(newChapters);
    }
  };

  const addCharacter = () => {
    if (characters.some(character => character.name.trim() === '')) {
      alert('You already have a character with no name. Please provide a name before adding a new character.');
      return;
    }
    const newCharacter = { name: '', description: '' };
    setCharacters([...characters, newCharacter]);
  };

  const deleteCharacter = (index) => {
    if (window.confirm("Are you sure you want to delete this character?")) {
      const newCharacters = characters.filter((_, idx) => idx !== index);
      setCharacters(newCharacters);
    }
  };

  const moveChapterUp = (index) => {
    const updatedChapters = [...chapters];
    const temp = updatedChapters[index];
    updatedChapters[index] = updatedChapters[index - 1];
    updatedChapters[index - 1] = temp;
    setChapters(updatedChapters);
  };

  const moveChapterDown = (index) => {
    const updatedChapters = [...chapters];
    const temp = updatedChapters[index];
    updatedChapters[index] = updatedChapters[index + 1];
    updatedChapters[index + 1] = temp;
    setChapters(updatedChapters);
  };

  const handleChapterClick = (index) => {
    setSelectedChapterTitle(chapters[index].title);
    setSelectedChapterContent(chapters[index].content);
    setSelectedChapterIndex(index);
    saveLastLoadedChapter(index);
  };

  const handleTitleInputChange = (e) => {
    setEditedChapterTitle(e.target.value);
  };

  const saveEditedChapterTitle = (index) => {
    const updatedChapters = [...chapters];
    updatedChapters[index].title = editedChapterTitle;
    setChapters(updatedChapters);
    setEditingChapterIndex(null);
  };

  const handleChapterContentChange = (e) => {
    const updatedContent = e.target.value;
    setSelectedChapterContent(updatedContent);
    const updatedChapters = [...chapters];
    updatedChapters[selectedChapterIndex].content = updatedContent;
    setChapters(updatedChapters);
  };

  const saveEditedCharacter = (index) => {
    const updatedCharacters = [...characters];
    updatedCharacters[index].name = editedCharacterName;
    updatedCharacters[index].description = editedCharacterDescription;
    setCharacters(updatedCharacters);
    setEditingCharacterIndex(null);
  };

  const handleQueryChange = (e) => {
    setSuggestionQuery(e.target.value);
  };

  const handleCheckboxChange = (setFunction) => (e) => {
    setFunction(e.target.checked);
  };

  const deleteAIThread = async (threadId, id) => {
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
      await deleteThread(threadId, id);
      setAiThreadId(null);

      setRefreshThread((prev) => {
        return !prev;
      });
    } catch (error) {
      console.error("Error deleting thread:", error);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        moreOptionsRef.current &&
        !moreOptionsRef.current.contains(event.target)
      ) {
        setIsMoreOptionsVisible(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const requestAISuggestions = async () => {
    if (!suggestionQuery.trim()) {
      alert('Please enter a query for suggestions.');
      return;
    }

    setLoading(true);
    setError(null);

    const userId = auth.currentUser.uid;
    const existingThreadId = await getAIThreadByStory(id);

    let threadId;
    if (existingThreadId) {
      threadId = existingThreadId;
    } else {
      threadId = await createAIThread(userId, id);
    }

    let systemMessage = `Introduce yourself once as AIPSBot, short for AI-Powered Storytelling Bot (look for the past conversation if you haven't introduced yourself already), you are an AI assistant helping with story writing. The user has requested:\n\n"${suggestionQuery}".`;

    if (threadId) {
      const pastConversationData = await getAIThread(threadId);
      if (Array.isArray(pastConversationData?.messages)) {
        const formattedPastConversation = pastConversationData.messages
          .map(msg => {
            const truncatedContent = msg.content.length > 1000 ? msg.content.substring(0, 1000) + '...' : msg.content;
            const isDuplicate = chapters.some(chap => {
              return (msg.content.includes(chap.title) && msg.content.length >= 0.7 * chap.content.length);
            });
            if (!isDuplicate) {
              return `(${msg.role}): ${truncatedContent}`;
            }
          })
          .filter(Boolean)
          .join('\n');

        systemMessage += `\n\nHere is the past conversation of the user and AI:\n${formattedPastConversation}`;
      } else {
        console.warn('Past conversation data is not in an expected array format.');
      }
    }

    if (includeMainDetails) {
      systemMessage += `\n\nHere is the story's main details:\nTitle: "${storyDetails.title}"\nDescription: "${storyDetails.description}"\nGenre: ${storyDetails.genre}\nLocation: ${storyDetails.location}`;
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
        return !prev;
      });

      setSuggestionQuery('');

    } catch (err) {
      console.error('Error fetching AI suggestions:', err.response || err.message);
      setError('Failed to fetch suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStory = async (e) => {
    e.preventDefault();
    if (!storyDetails.title || !storyDetails.description || chapters.length === 0) {
      alert('Please fill in all fields and ensure there is at least one chapter.');
      return;
    }
    setSavingStory(true);

    try {
      const storyPayload = {
        ...storyDetails,
        chapters,
        characters,
        updatedAt: new Date(),
        threadId: aiThreadId,
      };
      const saveSuccess = await updateStory(id, storyPayload);
      if (saveSuccess) {
        navigate('/stories');
      }
    } catch (error) {
      console.error('Error saving story:', error);
      alert('There was an error saving your story. Please try again.');
    } finally {
      setSavingStory(false);
    }
  };

  return (
    <div className="p-6 mt-16 flex">
      {/* Left side: Story Details and Chapters */}
      <div className="w-1/4 p-4 border mr-4 min-w-[25%] max-w-[33.3%]" style={{ height: "calc(100vh - 120px)", overflowY: "auto", resize: "horizontal" }}>
        <div className='flex items-center justify-between'>
          <div className="flex gap-3 items-center">
            <button
              type="button"
              className="bg-blue-600 text-white p-2 rounded shadow"
              onClick={() => navigate('/stories')}
              title="Go back to stories"
            >
              <FaArrowLeft />
            </button>
            <h2 className="text-xl font-bold">Story Details</h2>
          </div>
          <button
            type="submit"
            className={`bg-green-500 text-white p-3 rounded shadow ${savingStory ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={handleSaveStory}
            disabled={savingStory}
            title={savingStory ? "Saving..." : "Save story"}
          >
            <FaSave />
          </button>
        </div>

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
            value={storyDetails.dateStarted}
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
                <div key={index} className="mt-2 pl-2 border rounded-md flex justify-between items-center" style={{ cursor: "pointer" }} onClick={() => handleChapterClick(index)}>
                  {editingChapterIndex === index ? (
                    <input
                      type="text"
                      value={editedChapterTitle}
                      onChange={handleTitleInputChange}
                      onBlur={() => saveEditedChapterTitle(index)}
                      className="w-full p-2 mr-2 border rounded-md"
                      placeholder="Chapter Title"
                    />
                  ) : (
                    <h4 className="font-bold py-2">{chapter.title}</h4>
                  )}

                  <div className="flex items-end flex-col gap-2 pl-4 bg-slate-50 p-4">
                    <div className="flex gap-2">
                      {index > 0 && (
                        <button
                          onClick={() => moveChapterUp(index)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <FaArrowUp />
                        </button>
                      )}

                      {index < chapters.length - 1 && (
                        <button
                          onClick={() => moveChapterDown(index)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <FaArrowDown />
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {editingChapterIndex === index ? (
                        <button
                          onClick={() => {
                            saveEditedChapterTitle(index);
                          }}
                          className="text-green-500 hover:text-green-700"
                        >
                          <FaSave />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingChapterIndex(index);
                            setEditedChapterTitle(chapter.title);
                          }}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <FaEdit />
                        </button>
                      )}

                      <button
                        onClick={() => deleteChapter(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
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
                      <input
                        type="text"
                        value={editedCharacterName}
                        onChange={(e) => setEditedCharacterName(e.target.value)}
                        className="w-full p-2 mb-2 border rounded-md"
                        placeholder="Character Name"
                      />
                      <textarea
                        value={editedCharacterDescription}
                        onChange={(e) => setEditedCharacterDescription(e.target.value)}
                        className="w-full p-2 border rounded-md max-h-48"
                        placeholder="Character Description"
                      />
                    </>
                  ) : (
                    <>
                      <h4 className="font-bold">{character.name === '' ? "New Character" : character.name}</h4>
                      <p
                        className="text-gray-600"
                        dangerouslySetInnerHTML={{
                          __html: character.description
                            ? character.description.replace(/\n/g, "<br>")
                            : "No description provided",
                        }}
                      ></p>
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
                          setEditedCharacterDescription(character.description || '');
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
      </div>

      <div className="w-[calc(100%-33.3%)] p-4 border" style={{ resize: "horizontal" }}>
        <h2 className="text-xl font-bold">{selectedChapterTitle}</h2>
        <textarea
          value={selectedChapterContent}
          onChange={handleChapterContentChange}
          className="w-full h-96 p-2 mt-1 border resize-none"
          placeholder="Write your story here..."
          style={{ height: "calc(100vh - 200px)", overflowY: "auto" }}
        />
      </div>

      <button
        onClick={() => setIsChatVisible(!isChatVisible)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white rounded-full p-5 shadow-lg hover:bg-blue-600 transition ease-in-out text-3xl"
        style={{ zIndex: 1000 }}
        title="Chat with AIPSBot!"
      >
        <FaComments />
      </button>

      {isChatVisible &&
        (
          <div
            id="chat-with-aipsbot"
            className="w-1/3 border ml-4 fixed bottom-0 right-24 bg-white rounded-lg shadow-lg flex flex-col"
            style={{ height: "calc(100vh - 4.3rem)", overflowY: "auto", zIndex: 999 }}>
            <div className="flex justify-between items-center bg-blue-600 text-white px-4 py-2 rounded-t-lg">
              <h2 className="text-lg font-bold">Chat with AIPSBot</h2>
              <div className="flex items-center gap-2">
                {aiThreadId != null && <button
                  onClick={() => deleteAIThread(aiThreadId, id)}
                  className="text-white ml-auto bg-red-500 hover:bg-red-700 px-2 py-2 rounded"
                  title="Delete thread"
                >
                  <FaTrash />
                </button>}
                <button
                  onClick={() => setIsChatVisible(false)}
                  className="text-white hover:text-gray-300"
                >
                  <FaTimes size={20} />
                </button>
              </div>
            </div>

            <div className="mt-0 bg-gray-100">
              <AIThreadViewer threadId={aiThreadId} refreshThread={refreshThread} />
            </div>

            {/* User Query Input for AI Suggestions */}
            <div className="relative">
              <textarea
                value={suggestionQuery}
                onChange={handleQueryChange}
                className="w-[86%] resize-none p-4 min-h-28 focus:outline-none flex-1"
                placeholder="Ask me for help! (e.g., plot ideas, character names)"
              />
              <div className='absolute bottom-2 right-2 flex gap-2 flex-col'>
                <button
                  onClick={() => setIsMoreOptionsVisible(!isMoreOptionsVisible)}
                  className={`bg-green-500 text-white px-4 py-2 rounded mr-2 mb-2`}>
                  <FaBars />
                </button>
                <button
                  onClick={requestAISuggestions}
                  className={`bg-blue-500 text-white px-4 py-2 rounded mr-2 mb-2 ${loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  disabled={loading}
                  title={loading ? 'AIPSBot is thinking...' : ''}
                >
                  {loading ? <FaLightbulb /> : <FaPaperPlane />}
                </button>
              </div>

              {/* Error Display */}
              {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>
          </div>
        )
      }

      {isMoreOptionsVisible && (
        <div
          className="p-4 fixed bottom-4 right-44 bg-slate-100 rounded-lg shadow-lg"
          style={{ zIndex: 1000 }}
          ref={moreOptionsRef}>
          <p className='mb-2 italic'>Hint: Hover on the info icon to know more.</p>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="include-main-details"
              className="mr-2"
              checked={includeMainDetails}
              onChange={handleCheckboxChange(setIncludeMainDetails)}
            />
            <label htmlFor="include-main-details">Include main story details</label>
            <FaInfo
              className='text-lg ml-1 rounded-full bg-slate-300 p-[3px]'
              title="Includes main story details like the title. description, setting, and genre to the prompt"
            />
          </div>
          <div className="flex items-center mb-2">
            <input type="checkbox" id="include-characters" className="mr-2"
              checked={includeCharacters}
              onChange={handleCheckboxChange(setIncludeCharacters)} />
            <label htmlFor="include-characters">Include current characters</label>
            <FaInfo
              className='text-lg ml-1 rounded-full bg-slate-300 p-[3px]'
              title="Includes the current characters (if you listed them in the characters section) to the prompt"
            />
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="include-chapters" className="mr-2"
              checked={includeChapters}
              onChange={handleCheckboxChange(setIncludeChapters)} />
            <label htmlFor="include-chapters">Look back to previous chapters</label>
            <FaInfo
              className='text-lg ml-1 rounded-full bg-slate-300 p-[3px]'
              title="Includes all the previous chapters to the prompt"
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default StoryEditorPage;
