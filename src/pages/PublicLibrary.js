import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicStories } from '../firebase';

const PublicLibrary = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const storiesPerPage = 8;

  useEffect(() => {
    document.title = "Public Library | AIPS";
  }, []);

  useEffect(() => {
    const fetchPublicStories = async () => {
      setLoading(true);
      try {
        const publicStories = await getPublicStories();
        const sortedStories = publicStories.sort((a, b) => {
          const updatedA = a.updatedAt ? a.updatedAt.seconds : null;
          const updatedB = b.updatedAt ? b.updatedAt.seconds : null;
          const createdA = a.createdAt ? a.createdAt.seconds : null;
          const createdB = b.createdAt ? b.createdAt.seconds : null;

          if (updatedA && updatedB) {
            return updatedB - updatedA;
          } else if (updatedA) {
            return -1;
          } else if (updatedB) {
            return 1;
          } else if (createdA && createdB) {
            return createdB - createdA;
          } else if (createdA) {
            return -1;
          } else if (createdB) {
            return 1;
          }
          return 0;
        });
        setStories(sortedStories);
      } catch (error) {
        console.error('Error fetching public stories:', error);
        alert('Failed to fetch public stories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicStories();
  }, []);

  const totalPages = Math.ceil(stories.length / storiesPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="p-10 mt-20 min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl animate-pulse-neon"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-neon-purple/5 rounded-full blur-3xl animate-pulse-neon" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-neon-pink/5 rounded-full blur-3xl animate-pulse-neon" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10">
        {/* Header Section */}
        <div className='glass p-6 rounded-xl mb-6 border border-neon-blue/30 animate-slide-up'>
          <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
            <div>
              <h1 className="text-4xl font-bold font-['Orbitron'] gradient-text mb-2">Public Library</h1>
              <p className="text-gray-300">Discover stories shared by the community</p>
            </div>
            <input
              type="text"
              placeholder="Search public stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-3 bg-cyber-blue/50 border border-neon-blue/30 rounded-lg w-full md:w-[50%] text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 transition-all duration-300"
            />
          </div>
        </div>

        {/* Stories Section */}
        <div className="mt-8">
          {loading ? (
            <div className="glass p-8 rounded-xl text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-blue"></div>
              <p className="mt-4 text-gray-300">Loading public stories...</p>
            </div>
          ) : stories.length === 0 ? (
            <div className="glass p-12 rounded-xl text-center border border-neon-blue/20">
              <p className="text-xl text-gray-300">No public stories available yet.</p>
              <p className="text-gray-400 mt-2">Be the first to share your story!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {stories
                  .filter(story =>
                    story.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    story.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    story.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    story.genre?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .slice((currentPage - 1) * storiesPerPage, currentPage * storiesPerPage)
                  .map((story, index) => (
                    <div
                      key={story.id}
                      className="glass rounded-xl overflow-hidden shadow-xl border border-neon-blue/20 hover:border-neon-blue/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-neon-blue/20 group animate-slide-up"
                      style={{animationDelay: `${index * 0.1}s`}}
                    >
                      <div className="p-5 flex flex-col justify-between h-full min-h-[280px]">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-xl line-clamp-2 text-white group-hover:text-neon-blue transition-colors duration-300 flex-1">
                              {story.title || 'Untitled Story'}
                            </h3>
                            <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full flex-shrink-0">
                              Public
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs mb-2">by {story.author || 'Unknown Author'}</p>
                          {story.genre && (
                            <span className="inline-block px-2 py-1 text-xs bg-neon-purple/20 text-neon-purple rounded mb-2">
                              {story.genre}
                            </span>
                          )}
                          <p className="text-gray-400 line-clamp-3 text-sm leading-relaxed mt-2">
                            {story.description || 'No description available'}
                          </p>
                        </div>

                        <div className="mt-4 pt-4 border-t border-neon-blue/20">
                          <Link to={`/story/read/${story.id}`} className="block">
                            <button className="w-full bg-gradient-to-r from-neon-blue to-neon-purple text-white px-3 py-2 rounded-lg text-sm font-semibold hover:from-cyan-400 hover:to-purple-500 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-neon-blue/50">
                              Read Story
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Pagination */}
              {stories.length > storiesPerPage && (
                <div className="mt-8 glass p-4 rounded-xl flex justify-between items-center border border-neon-blue/20">
                  <button 
                    onClick={handlePreviousPage} 
                    disabled={currentPage === 1} 
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                      currentPage === 1 
                        ? "bg-cyber-blue/30 text-gray-500 cursor-not-allowed" 
                        : "bg-gradient-to-r from-neon-blue to-neon-purple text-white hover:scale-105 hover:shadow-lg hover:shadow-neon-blue/50"
                    }`}
                  >
                    Previous
                  </button>
                  <span className="text-gray-300 font-semibold">
                    Page {currentPage} of {Math.ceil(stories.length / storiesPerPage)}
                  </span>
                  <button 
                    onClick={handleNextPage} 
                    disabled={currentPage === Math.ceil(stories.length / storiesPerPage)} 
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                      currentPage === Math.ceil(stories.length / storiesPerPage) 
                        ? "bg-cyber-blue/30 text-gray-500 cursor-not-allowed" 
                        : "bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:scale-105 hover:shadow-lg hover:shadow-neon-purple/50"
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicLibrary;
