import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut, getAuth, onAuthStateChanged } from 'firebase/auth';

const Navbar = () => {
    const navigate = useNavigate();
    const auth = getAuth();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe(); // Cleanup subscription on unmount
    }, [auth]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <nav className="bg-blue-600 text-white p-4 flex justify-between fixed w-full top-0 z-10">
            <div className="flex items-center text-xl font-bold">AI-Powered Storytelling</div>
            <div>
                <Link to="/" className="mr-4">Home</Link>
                <Link to="/stories" className="mr-4">My Stories</Link>
                <Link to="/library" className="mr-4">Library</Link>
                <Link to="/ai-integration" className="mr-4">Create with AIPS</Link>
                {user ? (
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-4 py-2 rounded"
                    >
                        Logout
                    </button>
                ) : (
                    <Link
                        to="/login"
                        className="bg-green-500 text-white px-4 py-2 rounded"
                    >
                        Login
                    </Link>
                )}
            </div>
        </nav>
    );
}

export default Navbar;