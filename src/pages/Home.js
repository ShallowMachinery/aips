import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {

    useEffect(() => {
        document.title = "AIPS: AI-Powered Storytelling";
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 mt-10 p-10">
            <header className="bg-blue-600 text-white p-6 rounded-lg shadow-lg">
                <h1 className="text-4xl font-bold mb-2 text-center">AI-Powered Storytelling</h1>
                <p className="text-lg text-center">
                    Empower your creativity with AI. Create, develop, and enhance your stories with cutting-edge AI tools designed for writers.
                </p>
            </header>

            <section className="mt-8">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">What We Offer</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold text-blue-600 mb-2">Story Dashboard</h3>
                        <p className="text-gray-700">
                            Manage your stories seamlessly. View, create, edit, and delete your stories all in one place.
                        </p>
                        <Link
                            to="/stories"
                            className="inline-block mt-4 text-blue-500 hover:underline"
                        >
                            Explore Dashboard →
                        </Link>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold text-blue-600 mb-2">Character Development</h3>
                        <p className="text-gray-700">
                            Create compelling characters for your stories with our AI-driven tool to keep your readers hooked.
                        </p>
                        <Link
                            to="/library"
                            className="inline-block mt-4 text-blue-500 hover:underline"
                        >
                            Start Developing →
                        </Link>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold text-blue-600 mb-2">Create with AIPS!</h3>
                        <p className="text-gray-700">
                            Generate one-shot ideas, brainstorm scenes, or get suggestions to enhance your creative writing process.
                        </p>
                        <Link
                            to="/ai-integration"
                            className="inline-block mt-4 text-blue-500 hover:underline"
                        >
                            Try AIPS →
                        </Link>
                    </div>
                </div>
            </section>


            {/* <section className="mt-12">
                <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">Your Stories</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((_, index) => (
                        <div
                            key={index}
                            className="bg-white p-6 rounded-lg shadow-lg relative overflow-hidden"
                        >
                            <h3 className="text-lg font-bold text-blue-600 mb-2">Sample Story {index + 1}</h3>
                            <p className="text-gray-700 truncate">
                                This is a quick preview of your story's description. You can click below to view more details.
                            </p>
                            <Link
                                to={`/story/edit/sample-id-${index}`}
                                className="absolute bottom-4 right-4 bg-blue-500 text-white py-2 px-4 rounded-lg text-sm"
                            >
                                View Details
                            </Link>
                        </div>
                    ))}
                </div>
            </section> */}

            <footer className="fixed bottom-0 left-0 w-full bg-gray-200 p-6 shadow-inner">
                <div className="flex justify-center items-center">
                    <p className="text-center text-gray-600 mr-1">
                        &copy; 2024 AI Storytelling. All rights reserved. |
                    </p>
                    <Link to="/terms" className="text-gray-600 hover:text-blue-500">
                        Terms of Service
                    </Link>
                    <p className="text-center text-gray-600 ml-1">
                        | Balancing Human Creativity with AI Capabilities
                    </p>
                </div>
            </footer>


        </div>
    );
};

export default Home;
