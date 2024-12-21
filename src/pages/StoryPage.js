import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getStoryById } from "../firebase";

const StoryPage = () => {
  const { id } = useParams();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const fetchedStory = await getStoryById(id);
        console.log(fetchedStory);
        if (!fetchedStory) {
          setError("Story not found.");
        } else {
          setStory(fetchedStory);
        }
      } catch (err) {
        console.error("Error fetching story:", err);
        setError("Failed to load the story. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchStory();
  }, [id]);

  if (loading) {
    return <div className="max-w-3xl mx-auto mt-20 p-6"><p>Loading story...</p></div>;
  }

  if (error) {
    return <div className="max-w-3xl mx-auto mt-20 p-6"><p className="text-red-500">{error}</p></div>;
  }

  return (
    <div className="max-w-7xl mx-auto mt-20 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="md:col-span-2" id="details">
        <div className="relative bg-gradient-to-b from-blue-50 via-white to-gray-50 p-8 rounded-lg shadow-lg">
          <h1 className="text-4xl font-bold mb-4 text-gray-800">{story.title}</h1>
          <h2 className="text-2xl mb-4 text-gray-800">{story.author}</h2>
          <p className="text-gray-600 italic mb-6 text-lg">{story.description}</p>
        </div>

        {/* Characters Section */}
        {story.characters && story.characters.length > 0 && (
          <div className="mt-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700 border-b pb-2">Characters</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {story.characters.map((character, index) => (
                <li
                  key={index}
                  className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-gray-800">{character.name}</h3>
                  <p
                    className="text-gray-600"
                    dangerouslySetInnerHTML={{
                      __html: character.description
                        ? character.description.replace(/\n/g, "<br>")
                        : "No description provided",
                    }}
                  ></p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Chapters Section */}
        {story.chapters && story.chapters.length > 0 ? (
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-gray-700 border-b pb-2">Chapters</h2>
            {story.chapters.map((chapter, index) => (
              <div key={index} id={`chapter-${index}`} className="mb-12">
                <h3 className="text-xl font-bold mb-2 text-gray-800">{chapter.title}</h3>
                <p className="text-gray-700 whitespace-pre-line">{chapter.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No chapters available.</p>
        )}
      </div>

      {/* Table of Contents */}
      <div className="hidden md:block">
        <div className="p-4 border rounded-lg shadow-md bg-gray-50 sticky top-20">
          <h2 className="text-lg font-semibold mb-4 text-gray-700">{story.title}</h2>
          <ul className="space-y-2">
            <a
              href={`#details`}
              className="text-blue-500 hover:text-blue-700 transition-colors"
            >
              Description
            </a>
            {story.chapters && story.chapters.length > 0 && story.chapters.map((chapter, index) => (
              <li key={index}>
                <a
                  href={`#chapter-${index}`}
                  className="text-blue-500 hover:text-blue-700 transition-colors"
                >
                  {chapter.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StoryPage;
