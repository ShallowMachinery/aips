import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStoryById } from "../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const StoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const auth = getAuth();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const fetchedStory = await getStoryById(id);
        if (!fetchedStory) {
          setError("Story not found.");
          setLoading(false);
          return;
        }

        // Check if story is public or user owns it
        const isPublic = fetchedStory.isPublic === true;
        const currentUser = auth.currentUser || user;
        const isOwner = currentUser && fetchedStory.userId === currentUser.uid;

        if (!isPublic && !isOwner) {
          setError("This story is private. You don't have permission to view it.");
          setLoading(false);
          return;
        }

        setStory(fetchedStory);
      } catch (err) {
        console.error("Error fetching story:", err);
        setError("Failed to load the story. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch story - don't wait for auth if story might be public
    fetchStory();
  }, [id, user, auth]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-16 md:mt-20 p-4 md:p-6">
        <div className="glass p-8 md:p-12 rounded-xl text-center border" style={{borderColor: 'var(--border-primary)'}}>
          <div className="inline-block animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-2 border-b-2" style={{borderColor: 'var(--accent-blue)'}}></div>
          <p className="mt-4 text-sm md:text-base" style={{color: 'var(--text-secondary)'}}>Loading story...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-16 md:mt-20 p-4 md:p-6">
        <div className="glass p-6 md:p-8 rounded-xl border" style={{borderColor: 'rgba(239, 68, 68, 0.3)'}}>
          <p className="text-red-500 text-center text-sm md:text-base">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mt-16 md:mt-20 p-3 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 relative">
      {/* Subtle background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-20 right-10 w-64 h-64 md:w-96 md:h-96 rounded-full blur-3xl opacity-20 animate-float" style={{backgroundColor: 'var(--accent-blue)'}}></div>
        <div className="absolute bottom-20 left-10 w-56 h-56 md:w-80 md:h-80 rounded-full blur-3xl opacity-20 animate-float" style={{backgroundColor: 'var(--accent-purple)', animationDelay: '1s'}}></div>
      </div>

      {/* Main Content */}
      <div className="md:col-span-2 space-y-4 md:space-y-6" id="details">
        <div className="glass p-4 md:p-8 rounded-xl border shadow-xl animate-slide-up" style={{borderColor: 'var(--border-primary)'}}>
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 font-['Orbitron'] gradient-text break-words">{story.title}</h1>
          <h2 className="text-lg md:text-xl lg:text-2xl mb-2 md:mb-4 font-semibold" style={{color: 'var(--accent-blue)'}}>{story.author}</h2>
          <p className="italic mb-4 md:mb-6 text-sm md:text-base lg:text-lg leading-relaxed" style={{color: 'var(--text-secondary)'}}>{story.description}</p>
        </div>

        {/* Characters Section */}
        {story.characters && story.characters.length > 0 && (
          <div className="mt-4 md:mt-8 mb-4 md:mb-8">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 font-['Orbitron'] gradient-text border-b pb-2 md:pb-3" style={{borderColor: 'var(--border-primary)'}}>Characters</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {story.characters.map((character, index) => (
                <li
                  key={index}
                  className="glass p-4 md:p-6 rounded-xl border transition-all duration-300 hover:scale-105 hover:shadow-xl animate-slide-up"
                  style={{
                    borderColor: 'var(--border-primary)',
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  <h3 className="font-bold text-lg md:text-xl mb-2 md:mb-3 font-['Orbitron']" style={{color: 'var(--accent-purple)'}}>{character.name}</h3>
                  <p
                    className="leading-relaxed text-sm md:text-base"
                    style={{color: 'var(--text-secondary)'}}
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
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 font-['Orbitron'] gradient-text border-b pb-2 md:pb-3" style={{borderColor: 'var(--border-primary)'}}>Chapters</h2>
            {story.chapters.map((chapter, index) => (
              <div key={index} id={`chapter-${index}`} className="mb-8 md:mb-12 glass p-4 md:p-6 lg:p-8 rounded-xl border transition-all duration-300 animate-slide-up" style={{borderColor: 'var(--border-primary)', animationDelay: `${index * 0.1}s`}}>
                <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4 font-['Orbitron']" style={{color: 'var(--accent-blue)'}}>{chapter.title}</h3>
                <div 
                  className="leading-relaxed text-sm md:text-base lg:text-lg prose prose-invert max-w-none"
                  style={{
                    lineHeight: '1.8',
                    fontFamily: 'inherit',
                    color: 'var(--text-primary)'
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: chapter.content || '' 
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="glass p-4 md:p-8 rounded-xl border" style={{borderColor: 'var(--border-primary)'}}>
            <p className="text-center text-sm md:text-base" style={{color: 'var(--text-secondary)'}}>No chapters available.</p>
          </div>
        )}
      </div>

      {/* Table of Contents */}
      <div className="hidden md:block">
        <div className="glass-strong p-4 md:p-6 rounded-xl border shadow-xl sticky top-20 md:top-24 animate-slide-up" style={{borderColor: 'var(--border-primary)'}}>
          <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 font-['Orbitron'] gradient-text break-words">{story.title}</h2>
          <ul className="space-y-2 md:space-y-3">
            <li>
              <a
                href={`#details`}
                className="transition-colors duration-300 block py-2 border-b text-sm md:text-base"
                style={{color: 'var(--accent-blue)', borderColor: 'var(--border-primary)'}}
                onMouseEnter={(e) => e.target.style.color = 'var(--accent-purple)'}
                onMouseLeave={(e) => e.target.style.color = 'var(--accent-blue)'}
              >
                Description
              </a>
            </li>
            {story.chapters && story.chapters.length > 0 && story.chapters.map((chapter, index) => (
              <li key={index}>
                <a
                  href={`#chapter-${index}`}
                  className="transition-colors duration-300 block py-2 border-b text-sm md:text-base break-words"
                  style={{color: 'var(--text-secondary)', borderColor: 'var(--border-primary)'}}
                  onMouseEnter={(e) => e.target.style.color = 'var(--accent-blue)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
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
