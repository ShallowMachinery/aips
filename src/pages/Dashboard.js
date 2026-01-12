import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserStories, addStory, deleteStory, getUserData } from '../firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const Dashboard = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();
  const [user, setUser] = useState(null);

  const storiesPerPage = 4;

  useEffect(() => {
    document.title = "My Stories | AIPS";
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchUserStories = async () => {
      setLoading(true);
      try {
        const storiesFromFirebase = await getUserStories(user.uid);
        const sortedStories = storiesFromFirebase.sort((a, b) => {
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
        console.error('Error fetching user stories:', error);
        alert('Failed to fetch stories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserStories();
  }, [navigate, user]);

  const totalPages = Math.ceil(stories.length / storiesPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleCreateNewStory = async () => {
    try {
      // Get user data to set author name
      let authorName = user.email || 'Unknown Author';
      try {
        const userData = await getUserData(user.uid);
        if (userData && userData.firstName && userData.lastName) {
          authorName = `${userData.firstName} ${userData.lastName}`;
        }
      } catch (err) {
        console.log('Could not fetch user data, using email as author');
      }

      const newStory = {
        title: '',
        description: '',
        author: authorName,
        chapters: [{ title: 'Chapter', content: '' }],
        characters: [],
        userId: user.uid,
        isPublic: false,
        createdAt: new Date(),
      };

      const savedStory = await addStory(newStory);
      navigate(`/story/edit/${savedStory.id}`);
    } catch (error) {
      console.error('Error creating new story:', error);
      alert('Failed to create a new story. Please try again.');
    }
  };

  const handleDeleteStory = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this story?");
    if (confirmDelete) {
      try {
        await deleteStory(id);
        setStories(stories.filter((story) => story.id !== id));
      } catch (error) {
        console.error('Error deleting story:', error);
        alert('Failed to delete the story. Please try again.');
      }
    }
  };

  return (
    <div className="p-10 mt-20 min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl animate-pulse-neon"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-neon-purple/5 rounded-full blur-3xl animate-pulse-neon" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10">
        {/* Header Section */}
        <div className='glass p-6 rounded-xl mb-6 border border-neon-blue/30 animate-slide-up'>
          <div className='flex flex-col md:flex-row items-center justify-between gap-4'>
            <h1 className="text-4xl font-bold font-['Orbitron'] gradient-text">Story Dashboard</h1>
            <input
              type="text"
              placeholder="Search stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-3 bg-cyber-blue/50 border border-neon-blue/30 rounded-lg w-full md:w-[50%] text-white placeholder-gray-400 focus:outline-none focus:border-neon-blue focus:ring-2 focus:ring-neon-blue/50 transition-all duration-300"
            />
          </div>
        </div>

        {/* Create Story Button */}
        <button
          onClick={handleCreateNewStory}
          className="w-full glass-strong p-4 rounded-xl border border-neon-blue/30 hover:border-neon-blue/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-neon-blue/20 mb-8 group animate-slide-up"
          style={{animationDelay: '0.1s'}}
        >
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl group-hover:scale-110 transition-transform duration-300">✨</span>
            <span className="text-xl font-semibold text-white group-hover:text-neon-blue transition-colors duration-300 font-['Orbitron']">
              + Create New Story
            </span>
            <span className="text-2xl group-hover:scale-110 transition-transform duration-300">✨</span>
          </div>
        </button>

        {/* Stories Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6 font-['Orbitron'] gradient-text">Your Stories</h2>
          {loading ? (
            <div className="glass p-8 rounded-xl text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-blue"></div>
              <p className="mt-4 text-gray-300">Loading stories...</p>
            </div>
          ) : stories.length === 0 ? (
            <div className="glass p-12 rounded-xl text-center border border-neon-blue/20">
              <p className="text-xl text-gray-300">No stories found. Create your first story to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {stories
                .filter(story =>
                  story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  story.description?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .slice((currentPage - 1) * storiesPerPage, currentPage * storiesPerPage)
                .map((story, index) => (
                  <div
                    key={story.id}
                    className="glass rounded-xl overflow-hidden shadow-xl border border-neon-blue/20 hover:border-neon-blue/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-neon-blue/20 group animate-slide-up"
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    <div className="p-5 flex flex-col justify-between h-full min-h-[250px]">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-xl line-clamp-2 text-white group-hover:text-neon-blue transition-colors duration-300 flex-1">
                            {story.title || 'Untitled Story'}
                          </h3>
                          {story.isPublic && (
                            <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full">
                              Public
                            </span>
                          )}
                          {!story.isPublic && (
                            <span className="px-2 py-1 text-xs font-semibold bg-cyber-blue/50 text-gray-400 rounded-full">
                              Private
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 line-clamp-3 text-sm leading-relaxed">
                          {story.description || 'No description available'}
                        </p>
                      </div>

                      <div className="flex gap-2 mt-4 pt-4 border-t border-neon-blue/20">
                        <Link to={`/story/edit/${story.id}`} className="flex-1">
                          <button className="w-full bg-gradient-to-r from-neon-blue to-cyan-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 hover:scale-105">
                            Edit
                          </button>
                        </Link>
                        <Link to={`/story/read/${story.id}`} className="flex-1">
                          <button className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:from-orange-400 hover:to-pink-400 transition-all duration-300 hover:scale-105">
                            Read
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDeleteStory(story.id)}
                          className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 hover:scale-105"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

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
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
