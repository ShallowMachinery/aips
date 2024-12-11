import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserStories, addStory, deleteStory } from '../firebase'; // Import Firebase functions
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Import Firebase Auth

const Dashboard = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/login'); // Redirect to login if no user is authenticated
      }
    });

    return () => unsubscribe(); // Cleanup the observer on component unmount
  }, [auth, navigate]);

  // Fetch user's stories
  useEffect(() => {
    if (!user) return;

    const fetchUserStories = async () => {
      setLoading(true);
      try {
        const storiesFromFirebase = await getUserStories(user.uid); // Fetch stories for the logged-in user
        setStories(storiesFromFirebase);
      } catch (error) {
        console.error('Error fetching user stories:', error);
        alert('Failed to fetch stories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserStories();
  }, [navigate, user]);

  const handleCreateNewStory = async () => {
    try {
      const newStory = {
        title: 'New Story',
        description: 'Description for new story',
        chapters: [{ title: 'Prologue', content: '' }],
        characters: [],
        userId: user.uid, // Associate the story with the logged-in user
        createdAt: new Date(),
      };

      const savedStory = await addStory(newStory);
      navigate(`/story/edit/${savedStory.id}`); // Redirect to the edit page
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
        setStories(stories.filter((story) => story.id !== id)); // Remove the deleted story from the UI
      } catch (error) {
        console.error('Error deleting story:', error);
        alert('Failed to delete the story. Please try again.');
      }
    }
  };

  return (
    <div className="p-10 mt-16 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold">Story Dashboard</h1>

      <button
        onClick={handleCreateNewStory}
        className="bg-green-500 text-white p-3 mt-4 w-full rounded-lg"
      >
        + Create New Story
      </button>

      <div className="mt-6">
        <h2 className="font-bold">Your Stories</h2>
        {loading ? (
          <p>Loading stories...</p>
        ) : stories.length === 0 ? (
          <p>No stories found. Please add a story!</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 mt-4">
            {stories.map((story) => (
              <div
                key={story.id}
                className="border p-4 rounded-lg max-h-80 overflow-hidden relative w-full shadow-md"
              >
                <h3 className="font-bold">{story.title}</h3>
                <p className="min-h-[2.5em] line-clamp-2">{story.description}</p>

                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500">
                    <p>Created: {new Date(story.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                    {story.updatedAt && <p>Updated: {new Date(story.updatedAt.seconds * 1000).toLocaleDateString()}</p>}
                  </div>

                  <div className="flex space-x-2">
                    <Link to={`/story/edit/${story.id}`}>
                      <button className="bg-blue-500 text-white p-3 rounded-lg">Edit</button>
                    </Link>
                    <button
                      onClick={() => handleDeleteStory(story.id)}
                      className="bg-red-500 text-white p-3 rounded-lg"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
