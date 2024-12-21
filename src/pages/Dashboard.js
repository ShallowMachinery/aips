import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserStories, addStory, deleteStory } from '../firebase';
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
      const newStory = {
        title: '',
        description: '',
        chapters: [{ title: 'Chapter', content: '' }],
        characters: [],
        userId: user.uid,
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
    <div className="p-10 mt-16 rounded-lg shadow-md">
      <div className='flex items-center justify-between'>
        <h1 className="text-2xl font-bold">Story Dashboard</h1>
        <input
          type="text"
          placeholder="Search stories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="p-2 border rounded-lg w-[50%]"
        />
      </div>
      <button
        onClick={handleCreateNewStory}
        className="bg-green-500 text-white p-3 mt-4 w-full rounded-lg"
      >
        + Create New Story
      </button>

      <div className="mt-6">
        <h2 className="font-bold text-xl">Your Stories</h2>
        {loading ? (
          <p>Loading stories...</p>
        ) : stories.length === 0 ? (
          <p>No stories found. Please add a story!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 mt-4 self-center">
            {stories
              .filter(story =>
                story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                story.description.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .slice((currentPage - 1) * storiesPerPage, currentPage * storiesPerPage)
              .map((story) => (
                <div
                  key={story.id}
                  className="border rounded-lg overflow-hidden shadow-lg w-[300px] h-[200px] bg-white flex flex-col"
                >

                  {/* Cover Section
                  <div className="h-[60%] bg-gray-200 flex items-center justify-center">
                    <div className="text-gray-500 text-sm select-none">Cover Placeholder</div>
                  </div> */}

                  <div className="h-[40%] p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg line-clamp-2">{story.title}</h3>
                      <p className=" text-gray-600 line-clamp-3 mt-1 mb-2">{story.description}</p>
                    </div>

                    <div className="flex ml-auto gap-2">
                      <Link to={`/story/edit/${story.id}`}>
                        <button className="bg-blue-500 text-white px-3 py-3 rounded">Edit</button>
                      </Link>
                      <Link to={`/story/read/${story.id}`}>
                        <button className="bg-orange-500 text-white px-3 py-3 rounded">Read</button>
                      </Link>
                      <button
                        onClick={() => handleDeleteStory(story.id)}
                        className="bg-red-500 text-white px-3 py-3 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {stories.length > storiesPerPage &&
          <div className="mt-6 flex justify-between items-center">
            <button onClick={handlePreviousPage} disabled={currentPage === 1} className={`${currentPage === 1 ? "bg-gray-300" : "bg-blue-400"} transition-colors text-white p-3 rounded-lg`}>Previous</button>
            <span className="text-sm">Page {currentPage} of {Math.ceil(stories.length / storiesPerPage)}</span>
            <button onClick={handleNextPage} disabled={currentPage === Math.ceil(stories.length / storiesPerPage)} className={`${currentPage === Math.ceil(stories.length / storiesPerPage) ? "bg-gray-300" : "bg-blue-400"} transition-colors text-white p-3 rounded-lg`}>Next</button>
          </div>
        }

      </div>
    </div>
  );
}

export default Dashboard;
