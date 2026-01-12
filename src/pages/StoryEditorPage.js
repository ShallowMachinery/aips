import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { updateStory, getStoryById, getUserData, createAIThread, addMessageToThread, getAIThreadByStory, deleteThread, getAIThread } from '../firebase';
import Groq from 'groq-sdk';
import { FaEdit, FaSave, FaTrash, FaArrowUp, FaArrowDown, FaComments, FaTimes, FaPaperPlane, FaBars, FaLightbulb, FaArrowLeft, FaInfo, FaCog, FaBold, FaItalic, FaUnderline } from 'react-icons/fa';

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
    isPublic: false,
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
  const [isStoryOptionsVisible, setIsStoryOptionsVisible] = useState(false);
  const [fontFamily, setFontFamily] = useState('sans-serif');
  const moreOptionsRef = useRef(null);
  const storyOptionsRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userData = await getUserData(currentUser.uid);
        let authorName = currentUser.email || 'Unknown Author';
        if (userData && userData.firstName && userData.lastName) {
          authorName = `${userData.firstName} ${userData.lastName}`;
        }
        
        // Only update author if it's empty, undefined, or is an email address
        setStoryDetails(prev => {
          const currentAuthor = prev.author || '';
          const isEmail = currentAuthor.includes('@') && currentAuthor.includes('.');
          const isEmpty = !currentAuthor || currentAuthor.trim() === '';
          
          // Update if empty or if it's an email (meaning it wasn't properly set)
          if (isEmpty || isEmail) {
            return {
              ...prev,
              author: authorName,
            };
          }
          return prev;
        });
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
          // Check if author is missing or is an email, and update it
          const currentUser = auth.currentUser;
          if (currentUser) {
            const userData = await getUserData(currentUser.uid);
            let authorName = currentUser.email || 'Unknown Author';
            if (userData && userData.firstName && userData.lastName) {
              authorName = `${userData.firstName} ${userData.lastName}`;
            }
            
            const currentAuthor = story.author || '';
            const isEmail = currentAuthor.includes('@') && currentAuthor.includes('.');
            const isEmpty = !currentAuthor || currentAuthor.trim() === '';
            
            // Update story author if needed
            if (isEmpty || isEmail) {
              story.author = authorName;
            }
          }
          
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
            // Set editor content after a brief delay to ensure ref is ready
            setTimeout(() => {
              if (editorRef.current) {
                editorRef.current.innerHTML = story.chapters?.[lastChapterIndex]?.content || '';
              }
            }, 100);
          } else {
            setSelectedChapterTitle(story.chapters?.[0]?.title || '');
            setSelectedChapterContent(story.chapters?.[0]?.content || '');
            setTimeout(() => {
              if (editorRef.current) {
                editorRef.current.innerHTML = story.chapters?.[0]?.content || '';
              }
            }, 100);
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
    // Update editor content
    if (editorRef.current) {
      editorRef.current.innerHTML = chapters[index].content || '';
    }
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
    // Get content from event target if available, otherwise from editorRef
    const target = e?.target || editorRef.current;
    if (!target) return;
    
    const updatedContent = target.innerHTML || target.innerText || '';
    
    // Only update if we have a valid selectedChapterIndex
    if (selectedChapterIndex !== null && selectedChapterIndex >= 0 && selectedChapterIndex < chapters.length) {
      setSelectedChapterContent(updatedContent);
      const updatedChapters = [...chapters];
      updatedChapters[selectedChapterIndex].content = updatedContent;
      setChapters(updatedChapters);
    }
  };

  // Update editor content when chapter changes
  useEffect(() => {
    if (editorRef.current && selectedChapterContent !== undefined) {
      const currentContent = editorRef.current.innerHTML;
      // Only update if content is different to avoid cursor jumping
      if (selectedChapterContent !== currentContent && 
          (selectedChapterContent || '') !== (currentContent || '')) {
        editorRef.current.innerHTML = selectedChapterContent || '';
      }
    }
  }, [selectedChapterIndex]); // Update when switching chapters

  const handleFormatCommand = (command, value = null) => {
    editorRef.current?.focus();
    if (command === 'fontName') {
      // Use styleWithCSS for better font control
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('fontName', false, value);
    } else {
      document.execCommand(command, false, value);
    }
    // Trigger content change to save
    if (editorRef.current) {
      const event = new Event('input', { bubbles: true });
      editorRef.current.dispatchEvent(event);
    }
  };

  const handleFontFamilyChange = (e) => {
    const font = e.target.value;
    setFontFamily(font);
    editorRef.current?.focus();
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selection.toString()) {
      // Apply to selected text only
      document.execCommand('styleWithCSS', false, true);
      document.execCommand('fontName', false, font);
    } else {
      // Apply to entire editor - wrap all content in a span with the font
      if (editorRef.current) {
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('fontName', false, font);
        sel.removeAllRanges();
        // Also set as default font for new text
        editorRef.current.style.fontFamily = font;
      }
    }
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
      if (
        storyOptionsRef.current &&
        !storyOptionsRef.current.contains(event.target)
      ) {
        setIsStoryOptionsVisible(false);
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
        model: 'openai/gpt-oss-120b',
      });

      const rawSuggestions = response.choices[0]?.message?.content || '';
      const reasoning = response.choices[0]?.message?.reasoning || null;

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
        reasoning: reasoning,
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
      {/* Top Bar with Back and Save */}
      <div className="fixed top-20 left-0 right-0 z-40 glass-strong border-b border-neon-blue/30 p-4 flex items-center justify-between">
        <button
          type="button"
          className="bg-gradient-to-r from-neon-blue to-neon-purple text-white px-4 py-2 rounded-lg shadow-lg hover:from-cyan-400 hover:to-purple-500 transition-all duration-300 hover:scale-105"
          onClick={() => navigate('/stories')}
          title="Go back to stories"
        >
          <FaArrowLeft className="inline mr-2" />
          Back to Stories
        </button>
        <h2 className="text-2xl font-bold font-['Orbitron'] gradient-text">{storyDetails.title || 'Untitled Story'}</h2>
        <button
          type="submit"
          className={`bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-lg shadow-lg hover:from-green-400 hover:to-emerald-400 transition-all duration-300 hover:scale-105 ${savingStory ? "opacity-50 cursor-not-allowed" : ""}`}
          onClick={handleSaveStory}
          disabled={savingStory}
          title={savingStory ? "Saving..." : "Save story"}
        >
          <FaSave className="inline mr-2" />
          {savingStory ? "Saving..." : "Save Story"}
        </button>
      </div>

      {/* Left side: Chapters and Characters */}
      <div className="w-1/4 p-4 border mr-4 min-w-[25%] max-w-[33.3%] mt-20" style={{ height: "calc(100vh - 180px)", overflowY: "auto", resize: "horizontal" }}>
        {/* Chapters Section */}
        <div className="mt-4">
          <button 
            onClick={() => toggleSection('chapters')} 
            className="transition-colors duration-300"
            style={{ color: 'var(--accent-blue)' }}
            onMouseEnter={(e) => e.target.style.color = 'var(--accent-purple)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--accent-blue)'}
          >
            {expandedSections.chapters ? 'Hide Chapters' : 'Show Chapters'}
          </button>
          {expandedSections.chapters && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Chapters</h3>
              {chapters.map((chapter, index) => (
                <div 
                  key={index} 
                  className="mt-2 pl-2 border rounded-md flex justify-between items-center" 
                  style={{ 
                    cursor: "pointer",
                    borderColor: 'var(--border-primary)',
                    backgroundColor: 'var(--bg-secondary)'
                  }} 
                  onClick={() => handleChapterClick(index)}
                >
                  {editingChapterIndex === index ? (
                    <input
                      type="text"
                      value={editedChapterTitle}
                      onChange={handleTitleInputChange}
                      className="w-full p-2 mr-2 border rounded-md focus:outline-none focus:ring-2 transition-all duration-300"
                      style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        borderColor: 'var(--border-primary)'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--accent-blue)';
                        e.target.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = 'var(--border-primary)';
                        e.target.style.boxShadow = 'none';
                        saveEditedChapterTitle(index);
                      }}
                      placeholder="Chapter Title"
                    />
                  ) : (
                    <h4 className="font-bold py-2" style={{ color: 'var(--text-primary)' }}>{chapter.title}</h4>
                  )}

                  <div 
                    className="flex items-end flex-col gap-2 pl-4 p-4 rounded-r-md"
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    <div className="flex gap-2">
                      {index > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveChapterUp(index);
                          }}
                          className="transition-colors duration-300 p-1 rounded hover:bg-opacity-20"
                          style={{ color: 'var(--accent-blue)' }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(37, 99, 235, 0.2)';
                            e.target.style.color = 'var(--accent-purple)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = 'var(--accent-blue)';
                          }}
                        >
                          <FaArrowUp />
                        </button>
                      )}

                      {index < chapters.length - 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveChapterDown(index);
                          }}
                          className="transition-colors duration-300 p-1 rounded hover:bg-opacity-20"
                          style={{ color: 'var(--accent-blue)' }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(37, 99, 235, 0.2)';
                            e.target.style.color = 'var(--accent-purple)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = 'var(--accent-blue)';
                          }}
                        >
                          <FaArrowDown />
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {editingChapterIndex === index ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            saveEditedChapterTitle(index);
                          }}
                          className="transition-colors duration-300 p-1 rounded hover:bg-opacity-20"
                          style={{ color: '#10b981' }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                            e.target.style.color = '#059669';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#10b981';
                          }}
                        >
                          <FaSave />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingChapterIndex(index);
                            setEditedChapterTitle(chapter.title);
                          }}
                          className="transition-colors duration-300 p-1 rounded hover:bg-opacity-20"
                          style={{ color: 'var(--accent-blue)' }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(37, 99, 235, 0.2)';
                            e.target.style.color = 'var(--accent-purple)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = 'var(--accent-blue)';
                          }}
                        >
                          <FaEdit />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChapter(index);
                        }}
                        className="transition-colors duration-300 p-1 rounded hover:bg-opacity-20"
                        style={{ color: '#ef4444' }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                          e.target.style.color = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#ef4444';
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button 
                onClick={addChapter} 
                className="p-2 mt-2 rounded-lg transition-all duration-300 hover:scale-105"
                style={{ 
                  backgroundColor: '#10b981',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#059669';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#10b981';
                }}
              >
                Add Chapter
              </button>
            </div>
          )}
        </div>

        {/* Characters Section */}
        <div className="mt-4">
          <button 
            onClick={() => toggleSection('characters')} 
            className="transition-colors duration-300"
            style={{ color: 'var(--accent-purple)' }}
            onMouseEnter={(e) => e.target.style.color = 'var(--accent-pink)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--accent-purple)'}
          >
            {expandedSections.characters ? 'Hide Characters' : 'Show Characters'}
          </button>
          {expandedSections.characters && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Characters</h3>
              {characters.map((character, index) => (
                <div 
                  key={index} 
                  className="mt-2 p-2 border rounded-md"
                  style={{
                    borderColor: 'var(--border-primary)',
                    backgroundColor: 'var(--bg-secondary)'
                  }}
                >
                  {editingCharacterIndex === index ? (
                    <>
                      <input
                        type="text"
                        value={editedCharacterName}
                        onChange={(e) => setEditedCharacterName(e.target.value)}
                        className="w-full p-2 mb-2 border rounded-md focus:outline-none focus:ring-2 transition-all duration-300"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          borderColor: 'var(--border-primary)'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--accent-blue)';
                          e.target.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--border-primary)';
                          e.target.style.boxShadow = 'none';
                        }}
                        placeholder="Character Name"
                      />
                      <textarea
                        value={editedCharacterDescription}
                        onChange={(e) => setEditedCharacterDescription(e.target.value)}
                        className="w-full p-2 border rounded-md max-h-48 focus:outline-none focus:ring-2 transition-all duration-300"
                        style={{
                          backgroundColor: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          borderColor: 'var(--border-primary)'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--accent-blue)';
                          e.target.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--border-primary)';
                          e.target.style.boxShadow = 'none';
                        }}
                        placeholder="Character Description"
                      />
                    </>
                  ) : (
                    <>
                      <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>{character.name === '' ? "New Character" : character.name}</h4>
                      <p
                        style={{ color: 'var(--text-secondary)' }}
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
                        className="transition-colors duration-300 p-1 rounded hover:bg-opacity-20"
                        style={{ color: '#10b981' }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                          e.target.style.color = '#059669';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = '#10b981';
                        }}
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
                        className="transition-colors duration-300 p-1 rounded hover:bg-opacity-20"
                        style={{ color: 'var(--accent-purple)' }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'rgba(124, 58, 237, 0.2)';
                          e.target.style.color = 'var(--accent-pink)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                          e.target.style.color = 'var(--accent-purple)';
                        }}
                      >
                        <FaEdit />
                      </button>
                    )}
                    <button
                      onClick={() => deleteCharacter(index)}
                      className="transition-colors duration-300 p-1 rounded hover:bg-opacity-20"
                      style={{ color: '#ef4444' }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                        e.target.style.color = '#dc2626';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#ef4444';
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={addCharacter}
                className="p-2 mt-2 w-full rounded-lg transition-all duration-300 hover:scale-105"
                style={{ 
                  backgroundColor: 'var(--accent-purple)',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--accent-pink)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'var(--accent-purple)';
                }}
              >
                Add Character
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="w-[calc(100%-33.3%)] p-4 border mt-20" style={{ resize: "horizontal" }}>
        <h2 className="text-2xl font-bold mb-4 font-['Orbitron'] gradient-text">{selectedChapterTitle || 'Chapter'}</h2>
        
        {/* Formatting Toolbar */}
        <div className="glass p-3 rounded-t-lg border border-b-0 flex items-center gap-2 flex-wrap" style={{ borderColor: 'var(--border-primary)' }}>
          <button
            type="button"
            onClick={() => handleFormatCommand('bold')}
            className="p-2 rounded-lg transition-all duration-300 hover:scale-105"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--bg-tertiary)';
              e.target.style.borderColor = 'var(--accent-blue)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--bg-secondary)';
              e.target.style.borderColor = 'var(--border-primary)';
            }}
            title="Bold"
          >
            <FaBold />
          </button>
          <button
            type="button"
            onClick={() => handleFormatCommand('italic')}
            className="p-2 rounded-lg transition-all duration-300 hover:scale-105"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--bg-tertiary)';
              e.target.style.borderColor = 'var(--accent-blue)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--bg-secondary)';
              e.target.style.borderColor = 'var(--border-primary)';
            }}
            title="Italic"
          >
            <FaItalic />
          </button>
          <button
            type="button"
            onClick={() => handleFormatCommand('underline')}
            className="p-2 rounded-lg transition-all duration-300 hover:scale-105"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--bg-tertiary)';
              e.target.style.borderColor = 'var(--accent-blue)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--bg-secondary)';
              e.target.style.borderColor = 'var(--border-primary)';
            }}
            title="Underline"
          >
            <FaUnderline />
          </button>
          <div className="w-px h-6 mx-1" style={{ backgroundColor: 'var(--border-primary)' }}></div>
          <select
            value={fontFamily}
            onChange={handleFontFamilyChange}
            className="p-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-300"
            title="Font Family"
            style={{ 
              fontFamily: fontFamily,
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent-blue)';
              e.target.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.2)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-primary)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <option value="sans-serif" style={{ fontFamily: 'sans-serif', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Sans Serif</option>
            <option value="serif" style={{ fontFamily: 'serif', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Serif</option>
            <option value="monospace" style={{ fontFamily: 'monospace', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Monospace</option>
          </select>
        </div>

        {/* Content Editable Editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleChapterContentChange}
          className="w-full p-4 border rounded-b-lg resize-none focus:outline-none focus:ring-2 transition-all duration-300"
          style={{ 
            height: "calc(100vh - 340px)", 
            overflowY: "auto",
            fontFamily: fontFamily,
            minHeight: '200px',
            lineHeight: '1.6',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border-primary)'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--accent-blue)';
            e.target.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-primary)';
            e.target.style.boxShadow = 'none';
            handleChapterContentChange();
          }}
          data-placeholder="Write your story here..."
          suppressContentEditableWarning={true}
        >
        </div>
      </div>

      {/* Story Options Button */}
      <button
        onClick={() => setIsStoryOptionsVisible(!isStoryOptionsVisible)}
        className={`fixed rounded-full p-5 shadow-lg transition-all duration-300 hover:scale-110 text-3xl ${
          isStoryOptionsVisible 
            ? "bottom-[calc(100vh-8rem)] right-4 bg-gradient-to-r from-purple-600 to-pink-600" 
            : "bottom-24 right-4 bg-gradient-to-r from-neon-purple to-neon-pink hover:from-purple-500 hover:to-pink-500"
        }`}
        style={{ zIndex: 1000 }}
        title="Story Options"
      >
        <FaCog />
      </button>

      {/* Chat Button */}
      <button
        onClick={() => setIsChatVisible(!isChatVisible)}
        className={`fixed rounded-full p-5 shadow-lg transition-all duration-300 hover:scale-110 text-3xl ${
          isStoryOptionsVisible
            ? "bottom-4 right-[28rem] bg-gradient-to-r from-neon-blue to-neon-purple hover:from-cyan-400 hover:to-purple-500"
            : "bottom-4 right-4 bg-gradient-to-r from-neon-blue to-neon-purple hover:from-cyan-400 hover:to-purple-500"
        }`}
        style={{ zIndex: 1000 }}
        title="Chat with AIPSBot!"
      >
        <FaComments />
      </button>

      {/* Story Options Panel */}
      {isStoryOptionsVisible && (
        <div
          className="fixed bottom-24 right-24 w-96 glass-strong rounded-xl shadow-2xl border border-neon-purple/30 overflow-hidden"
          style={{ height: "calc(100vh - 8rem)", zIndex: 998 }}
          ref={storyOptionsRef}
        >
          <div className="flex justify-between items-center bg-gradient-to-r from-neon-purple to-neon-pink text-white px-5 py-3">
            <h2 className="text-lg font-bold font-['Orbitron']">Story Options</h2>
            <button
              onClick={() => setIsStoryOptionsVisible(false)}
              className="text-white hover:bg-white/20 px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105"
            >
              <FaTimes size={18} />
            </button>
          </div>
          <div className="p-6 overflow-y-auto" style={{ height: "calc(100% - 60px)" }}>
            <form className="space-y-4">
              <div>
                <label className="block mb-2 font-semibold" style={{ color: 'var(--text-primary)' }}>Title</label>
                <input
                  type="text"
                  name="title"
                  value={storyDetails.title}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent-blue)';
                    e.target.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-primary)';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="Story Title"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold" style={{ color: 'var(--text-primary)' }}>Author</label>
                <input
                  type="text"
                  name="author"
                  value={storyDetails.author}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent-blue)';
                    e.target.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-primary)';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="Author Name"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold" style={{ color: 'var(--text-primary)' }}>Description</label>
                <textarea
                  name="description"
                  value={storyDetails.description}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 resize-none min-h-32"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent-blue)';
                    e.target.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-primary)';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="Story Description"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold" style={{ color: 'var(--text-primary)' }}>Date Started</label>
                <input
                  type="date"
                  name="dateStarted"
                  value={storyDetails.dateStarted}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent-blue)';
                    e.target.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-primary)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold" style={{ color: 'var(--text-primary)' }}>Genre</label>
                <input
                  type="text"
                  name="genre"
                  value={storyDetails.genre}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent-blue)';
                    e.target.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-primary)';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="Genre"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold" style={{ color: 'var(--text-primary)' }}>Location</label>
                <input
                  type="text"
                  name="location"
                  value={storyDetails.location}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent-blue)';
                    e.target.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-primary)';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="Location (e.g., Forest, Space)"
                />
              </div>
              <div className="flex items-center p-4 rounded-lg border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                <input
                  type="checkbox"
                  id="isPublic"
                  name="isPublic"
                  checked={storyDetails.isPublic || false}
                  onChange={(e) => setStoryDetails(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="w-5 h-5 cursor-pointer mr-3"
                  style={{ accentColor: 'var(--accent-blue)' }}
                />
                <label htmlFor="isPublic" className="cursor-pointer flex-1" style={{ color: 'var(--text-primary)' }}>
                  Make this story public (others can read it)
                </label>
              </div>
            </form>
          </div>
        </div>
      )}

      {isChatVisible &&
        (
          <div
            id="chat-with-aipsbot"
            className={`w-1/3 border border-neon-blue/30 fixed bottom-0 glass-strong rounded-xl shadow-2xl flex flex-col overflow-hidden ${
              isStoryOptionsVisible ? "right-[28rem]" : "right-24 ml-4"
            }`}
            style={{ height: "calc(100vh - 4.3rem)", zIndex: 999 }}>
            <div className="flex justify-between items-center bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink text-white px-5 py-3 rounded-t-xl shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-sm">🤖</span>
                </div>
                <h2 className="text-lg font-bold font-['Orbitron']">Chat with AIPSBot</h2>
              </div>
              <div className="flex items-center gap-2">
                {aiThreadId != null && <button
                  onClick={() => deleteAIThread(aiThreadId, id)}
                  className="text-white bg-red-500/80 hover:bg-red-600 px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/50"
                  title="Delete thread"
                >
                  <FaTrash size={14} />
                </button>}
                <button
                  onClick={() => setIsChatVisible(false)}
                  className="text-white hover:bg-white/20 px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105"
                >
                  <FaTimes size={18} />
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-b from-cyber-darker to-black flex-1 overflow-hidden flex flex-col">
              <AIThreadViewer threadId={aiThreadId} refreshThread={refreshThread} />
            </div>

            {/* User Query Input for AI Suggestions */}
            <div className="relative border-t border-neon-blue/30 bg-black p-4">
              <div className="relative">
                <textarea
                  value={suggestionQuery}
                  onChange={handleQueryChange}
                  className="w-full resize-none p-4 min-h-28 focus:outline-none bg-cyber-blue/50 text-white border border-neon-blue/30 rounded-lg focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 transition-all duration-300 placeholder-gray-500"
                  placeholder="Ask me for help! (e.g., plot ideas, character names, story suggestions...)"
                  style={{ paddingRight: '100px' }}
                />
                <div className='absolute bottom-4 right-4 flex gap-2'>
                  <button
                    onClick={() => setIsMoreOptionsVisible(!isMoreOptionsVisible)}
                    className={`bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg hover:from-green-400 hover:to-emerald-400 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/50 ${isMoreOptionsVisible ? 'ring-2 ring-green-400' : ''}`}
                    title="More options"
                  >
                    <FaBars />
                  </button>
                  <button
                    onClick={requestAISuggestions}
                    className={`bg-gradient-to-r from-neon-blue to-neon-purple text-white px-4 py-2 rounded-lg hover:from-cyan-400 hover:to-purple-500 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-neon-blue/50 ${loading ? "opacity-50 cursor-not-allowed animate-pulse" : ""}`}
                    disabled={loading}
                    title={loading ? 'AIPSBot is thinking...' : 'Send message'}
                  >
                    {loading ? <FaLightbulb className="animate-pulse" /> : <FaPaperPlane />}
                  </button>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>
        )
      }

      {isMoreOptionsVisible && (
        <div
          className={`p-4 fixed glass-strong rounded-lg shadow-2xl border border-neon-blue/30 ${
            isStoryOptionsVisible ? "bottom-4 right-[32rem]" : "bottom-4 right-44"
          }`}
          style={{ zIndex: 1000 }}
          ref={moreOptionsRef}>
          <p className='mb-2 italic text-gray-300'>Hint: Hover on the info icon to know more.</p>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="include-main-details"
              className="mr-2 accent-neon-blue"
              checked={includeMainDetails}
              onChange={handleCheckboxChange(setIncludeMainDetails)}
            />
            <label htmlFor="include-main-details" className="text-gray-300">Include main story details</label>
            <FaInfo
              className='text-lg ml-1 rounded-full bg-neon-blue/30 text-neon-blue p-[3px]'
              title="Includes main story details like the title. description, setting, and genre to the prompt"
            />
          </div>
          <div className="flex items-center mb-2">
            <input type="checkbox" id="include-characters" className="mr-2 accent-neon-blue"
              checked={includeCharacters}
              onChange={handleCheckboxChange(setIncludeCharacters)} />
            <label htmlFor="include-characters" className="text-gray-300">Include current characters</label>
            <FaInfo
              className='text-lg ml-1 rounded-full bg-neon-blue/30 text-neon-blue p-[3px]'
              title="Includes the current characters (if you listed them in the characters section) to the prompt"
            />
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="include-chapters" className="mr-2 accent-neon-blue"
              checked={includeChapters}
              onChange={handleCheckboxChange(setIncludeChapters)} />
            <label htmlFor="include-chapters" className="text-gray-300">Look back to previous chapters</label>
            <FaInfo
              className='text-lg ml-1 rounded-full bg-neon-blue/30 text-neon-blue p-[3px]'
              title="Includes all the previous chapters to the prompt"
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default StoryEditorPage;
