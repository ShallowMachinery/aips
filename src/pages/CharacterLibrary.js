import React, { useState, useEffect } from "react";
import { getUserStoriesWithCharacters } from "../firebase"; // Adjust import path

const CharacterLibrary = ({ userId }) => {
  const [stories, setStories] = useState([]);
  const [expandedStoryId, setExpandedStoryId] = useState(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const fetchedStories = await getUserStoriesWithCharacters(userId);
        setStories(fetchedStories);
      } catch (error) {
        console.error("Error fetching stories:", error);
      }
    };
    fetchStories();
  }, [userId]);

  const toggleExpand = (storyId) => {
    setExpandedStoryId(expandedStoryId === storyId ? null : storyId);
  };

  return (
    <div>
      <h1>Character Library</h1>
      <ul>
        {stories.map((story) => (
          <li key={story.id}>
            <div onClick={() => toggleExpand(story.id)} style={{ cursor: "pointer" }}>
              {story.title}
            </div>
            {expandedStoryId === story.id && (
              <ul style={{ paddingLeft: "20px" }}>
                {story.characters.map((character, index) => (
                  <li key={index}>{character.name} - {character.role}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CharacterLibrary;
