import React, { useState, useEffect } from "react";
import Groq from 'groq-sdk';
import { FaTrash } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import { getUserStoriesWithCharacters, getUserData, updateStory } from "../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const groq = new Groq({ apiKey: process.env.REACT_APP_GROQCLOUD_API_KEY, dangerouslyAllowBrowser: true });

const CharacterLibrary = () => {
    const auth = getAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [uiError, setUiError] = useState("");
    const [userId, setUserId] = useState("");
    const [stories, setStories] = useState([]);
    const [expandedStoryId, setExpandedStoryId] = useState(null);
    const [formState, setFormState] = useState({});
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUserId(currentUser.uid);
            } else {
                navigate("/login");
            }
        });
    }, [auth, navigate]);

    useEffect(() => {
        document.title = "Character Library | AIPS";
        if (!userId) return;

        const fetchStories = async () => {
            setLoading(true);
            try {
                const fetchedStories = await getUserStoriesWithCharacters(userId);
                setStories(fetchedStories);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching stories:", error);
                setError(error);
                setLoading(false);
            }
        };
        fetchStories();
    }, [userId]);

    const toggleExpand = (storyId) => {
        setExpandedStoryId(expandedStoryId === storyId ? null : storyId);
    };

    const handleInputChange = (e, storyId) => {
        const { name, value } = e.target;
        setFormState({
            ...formState,
            [storyId]: {
                ...formState[storyId],
                [name]: value,
            },
        });
    };

    const onGenerateCharacter = async (story, storyId) => {
        const characterForm = formState[storyId] || { name: "", description: "" };
        if (!characterForm.name.trim() && !characterForm.description.trim()) {
            alert("Please provide a name or partial description to get AI suggestions.");
            return;
        }

        setIsGenerating(true);
        try {
            const response = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are an AI creative assistant. Based on the user's inputs and the story description, generate a fictional character. 
                                  Include the following fields:
                                  **Name:** A unique and appropriate character name.
                                  **Gender:** One of Male, Female, or Other.
                                  **Description:** A short description of the character's background, personality, or unique traits.`,
                    },
                    {
                        role: "user",
                        content: `Story Title: ${story.title}\nStory Description: ${story.description || "No description provided."}\nStory Genre: ${story.genre || "No genre specified."}\nStory Location: ${story.location || "No location specified."}\nCharacter Name: ${characterForm.name || "Unknown"}\nCharacter Description: ${characterForm.description || "No initial description provided."}`,
                    },
                ],
                model: "llama3-8b-8192",
            });

            const rawCharacterData = response.choices[0]?.message?.content || "";

            const match = rawCharacterData.match(
                /\*\*Name:\*\*\s*([\s\S]+?)\n\*\*Gender:\*\*\s*([\s\S]+?)\n\*\*Description:\*\*\s*([\s\S]+)/
            );

            if (match) {
                setFormState({
                    ...formState,
                    [storyId]: {
                        name: match[1].trim(),
                        gender: match[2].trim(),
                        description: match[3].trim(),
                    },
                });
            } else {
                throw new Error("Unexpected AI response format.");
            }
        } catch (err) {
            console.error("Error generating character:", err.response || err.message);
            alert("Failed to generate character. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const addCharacterToStory = async (storyId) => {
        try {
            const storyToUpdate = stories.find((story) => story.id === storyId);
            if (!storyToUpdate) {
                throw new Error("Story not found");
            }

            const updatedStory = {
                ...storyToUpdate,
                characters: [...storyToUpdate.characters, formState[storyId]],
            };

            await updateStory(storyId, { characters: updatedStory.characters });

            setStories((prevStories) =>
                prevStories.map((story) =>
                    story.id === storyId ? updatedStory : story
                )
            );

            setFormState((prevFormState) => ({
                ...prevFormState,
                [storyId]: { name: "", gender: "Male", description: "" },
            }));
            setUiError("");
        } catch (error) {
            console.error("Failed to add character to story:", error);
            setUiError("Failed to add character. Please try again.");
            alert("Failed to add character to story. Please try again.");

        }
    };

    const deleteCharacterFromStory = async (storyId, characterIndex) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this character? This action cannot be undone."
        );
        if (!confirmDelete) return;

        try {
            const storyToUpdate = stories.find((story) => story.id === storyId);
            if (!storyToUpdate) {
                throw new Error("Story not found");
            }

            const updatedCharacters = storyToUpdate.characters.filter(
                (_, index) => index !== characterIndex
            );

            const updatedStory = {
                ...storyToUpdate,
                characters: updatedCharacters,
            };

            await updateStory(storyId, { characters: updatedCharacters });

            setStories((prevStories) =>
                prevStories.map((story) =>
                    story.id === storyId ? updatedStory : story
                )
            );

            alert("Character deleted successfully!");
        } catch (error) {
            console.error("Failed to delete character:", error);
            alert("Failed to delete character. Please try again.");
        }
    };


    if (loading) {
        return (
            <div className="container mx-auto p-4 mt-20">
                <h1>Loading...</h1>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container mx-auto p-4 mt-20">
                <h1>Something went wrong.</h1>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-10 mt-20 min-h-screen relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-10 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl animate-pulse-neon"></div>
                <div className="absolute bottom-20 left-10 w-80 h-80 bg-neon-pink/5 rounded-full blur-3xl animate-pulse-neon" style={{animationDelay: '1s'}}></div>
            </div>

            <div className="relative z-10">
                <h1 className="text-5xl font-bold mb-8 font-['Orbitron'] gradient-text animate-slide-up">Character Library</h1>
                {stories.map((story, storyIndex) => (
                    <div key={story.id} className="glass rounded-xl mb-6 border border-neon-purple/20 hover:border-neon-purple/50 transition-all duration-300 overflow-hidden animate-slide-up" style={{animationDelay: `${storyIndex * 0.1}s`}}>
                        <div
                            className="flex items-center justify-between p-6 cursor-pointer hover:bg-cyber-blue/30 transition-colors duration-300"
                            onClick={() => toggleExpand(story.id)}
                        >
                            <h2 className="text-2xl font-semibold text-white font-['Orbitron']">{story.title}</h2>
                            <div className="flex gap-4 items-center">
                                <button 
                                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-400 hover:to-blue-400 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/50"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`/story/edit/${story.id}`, '_blank');
                                    }}
                                >
                                    Edit
                                </button>
                                <span className="text-neon-purple text-xl font-bold">{expandedStoryId === story.id ? '−' : '+'}</span>
                            </div>
                        </div>

                        {expandedStoryId === story.id && (
                            <div className="p-6 border-t border-neon-purple/20">
                                {story.characters.length > 0 ? (
                                    <div className="mb-6">
                                        <h3 className="text-2xl font-semibold mb-6 text-neon-purple font-['Orbitron']">Characters:</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {story.characters.map((character, index) => (
                                                <div
                                                    key={index}
                                                    className="glass p-5 rounded-lg border border-neon-blue/20 hover:border-neon-blue/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-neon-blue/20"
                                                >
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h4 className="text-xl font-bold text-neon-blue font-['Orbitron']">
                                                            {character.name === '' ? "New Character" : character.name}
                                                        </h4>
                                                        <button
                                                            className="text-red-400 hover:text-red-300 transition-colors duration-300"
                                                            onClick={() => deleteCharacterFromStory(story.id, index)}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                    <p
                                                        className="text-sm text-gray-300 leading-relaxed"
                                                        dangerouslySetInnerHTML={{
                                                            __html: character.description
                                                                ? character.description.replace(/\n/g, "<br>")
                                                                : "No description provided",
                                                        }}
                                                    ></p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-6 p-6 glass rounded-lg border border-neon-purple/20">
                                        <h3 className="text-lg text-gray-400 text-center">There are no characters for this story.</h3>
                                    </div>
                                )}

                                <div className="glass-strong p-6 rounded-lg border border-neon-blue/30">
                                    <h3 className="text-2xl font-semibold mb-6 text-neon-blue font-['Orbitron']">Add a Character:</h3>
                                    <div className="flex flex-col gap-4">
                                        <input
                                            type="text"
                                            name="name"
                                            value={formState[story.id]?.name || ""}
                                            onChange={(e) => handleInputChange(e, story.id)}
                                            placeholder="Character Name"
                                            className="p-3 bg-cyber-blue/50 border border-neon-blue/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 transition-all duration-300"
                                        />
                                        <select
                                            name="gender"
                                            value={formState[story.id]?.gender || "Male"}
                                            onChange={(e) => handleInputChange(e, story.id)}
                                            className="p-3 bg-cyber-blue/50 border border-neon-blue/30 rounded-lg text-white focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 transition-all duration-300"
                                        >
                                            <option value="Male" className="bg-cyber-blue">Male</option>
                                            <option value="Female" className="bg-cyber-blue">Female</option>
                                            <option value="Other" className="bg-cyber-blue">Other</option>
                                        </select>
                                        <textarea
                                            name="description"
                                            value={formState[story.id]?.description || ""}
                                            onChange={(e) => handleInputChange(e, story.id)}
                                            placeholder="Short description"
                                            className="p-3 bg-cyber-blue/50 border border-neon-blue/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 transition-all duration-300 resize-none min-h-24"
                                        ></textarea>
                                        <button
                                            className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-400 hover:to-emerald-400 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            onClick={() => onGenerateCharacter(story, story.id)}
                                            disabled={isGenerating}
                                        >
                                            {isGenerating ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                                    Generating...
                                                </span>
                                            ) : (
                                                '✨ Generate with AI'
                                            )}
                                        </button>
                                        <button
                                            className="p-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white rounded-lg font-semibold hover:from-cyan-400 hover:to-purple-500 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-neon-blue/50"
                                            onClick={() => addCharacterToStory(story.id)}
                                        >
                                            Add Character to Story
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CharacterLibrary;
