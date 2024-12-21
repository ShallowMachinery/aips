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
        document.title = "Library | AIPS";
        if (!userId) return;

        const fetchStories = async () => {
            setLoading(true);
            try {
                const fetchedStories = await getUserStoriesWithCharacters(userId);
                console.log(fetchedStories);
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
        console.log(story);
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
            console.log(rawCharacterData);

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
            console.log("Character added and story updated successfully!");
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

            console.log("Character deleted successfully!");
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
        <div className="container mx-auto p-4 mt-20">
            <h1 className="text-3xl font-bold mb-3">Stories</h1>
            {stories.map((story) => (
                <div key={story.id} className="bg-white shadow-md rounded mb-4">
                    <div
                        className="flex items-center justify-between p-4 cursor-pointer"
                        onClick={() => toggleExpand(story.id)}
                    >
                        <h2 className="text-lg font-semibold">{story.title}</h2>
                        <div className="flex gap-4 items-center">
                            <button className="p-2 bg-cyan-500 text-white rounded-lg" onClick={() => window.open(`/story/edit/${story.id}`, '_blank')}>Edit</button>
                            <span>{expandedStoryId === story.id ? '[-]' : '[+]'}</span>
                        </div>
                    </div>

                    {expandedStoryId === story.id && (
                        <div>
                            {story.characters.length > 0 ? (
                                <div className="p-4 border-t">
                                    <h3 className="text-md font-semibold mb-4">Characters:</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {story.characters.map((character, index) => (
                                            <div
                                                key={index}
                                                className="bg-gray-100 shadow-sm rounded-lg p-4"
                                            >
                                                <div>
                                                    <h4 className="text-lg font-semibold mb-2">{character.name === '' ? "New Character" : character.name}</h4>
                                                    <p
                                                        className="text-sm text-gray-700"
                                                        dangerouslySetInnerHTML={{
                                                            __html: character.description
                                                                ? character.description.replace(/\n/g, "<br>")
                                                                : "No description provided",
                                                        }}
                                                    ></p>
                                                </div>

                                                <div className="bottom-0">
                                                    <button
                                                        className="top-2 right-2 text-red-500"
                                                        onClick={() => deleteCharacterFromStory(story.id, index)}
                                                    >Delete</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 border-t">
                                    <h3 className="text-md mb-4">There are no characters for this story.</h3>
                                </div>
                            )}

                            <div className="p-4 border-t">
                                <h3 className="text-md font-semibold mb-4">Add a Character:</h3>
                                <div className="flex flex-col gap-4">
                                    <input
                                        type="text"
                                        name="name"
                                        value={formState[story.id]?.name || ""}
                                        onChange={(e) => handleInputChange(e, story.id)}
                                        placeholder="Name"
                                        className="p-2 border rounded"
                                    />
                                    <select
                                        name="gender"
                                        value={formState[story.id]?.gender || "Male"}
                                        onChange={(e) => handleInputChange(e, story.id)}
                                        className="p-2 border rounded"
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    <textarea
                                        name="description"
                                        value={formState[story.id]?.description || ""}
                                        onChange={(e) => handleInputChange(e, story.id)}
                                        placeholder="Short description"
                                        className="p-2 border rounded"
                                    ></textarea>
                                    <button
                                        className="p-2 bg-green-500 text-white rounded"
                                        onClick={() => onGenerateCharacter(story, story.id)}
                                        disabled={isGenerating}
                                    >
                                        {isGenerating ? "Generating..." : "Generate with AI"}
                                    </button>
                                    <button
                                        className="p-2 bg-blue-500 text-white rounded"
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
    );
};

export default CharacterLibrary;
