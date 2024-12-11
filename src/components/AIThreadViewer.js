import React, { useEffect, useState, useRef } from "react";
import { getAIThread } from "../firebase"; // Import the function

const AIThreadViewer = ({ threadId, refreshThread }) => {
    const [thread, setThread] = useState(null);
    const [loading, setLoading] = useState(true); // Add loading state
    const [error, setError] = useState(null);
    const scrollableDivRef = useRef(null);

    const scrollToBottom = () => {
        if (scrollableDivRef.current) {
            scrollableDivRef.current.scrollTo({
                top: scrollableDivRef.current.scrollHeight,
            });
        }
    };

    useEffect(() => {
        const fetchThread = async () => {
            if (!threadId) {
                setThread(null);
                console.log("Thread ID is not available yet or deleted.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                console.log("Fetching thread with ID:", threadId);
                const fetchedThread = await getAIThread(threadId);
                if (fetchedThread) {
                    setThread(fetchedThread);
                    setLoading(false);
                    setError(null);
                } else {
                    setError("No AI thread exists for this story.");
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error fetching AI thread:", err);
                setLoading(false);
                setError("An error occurred while fetching the AI thread.");
            } finally {
                setLoading(false);
            }
        };

        fetchThread();
    }, [threadId, refreshThread]);

    useEffect(() => {
        // Scroll to bottom whenever thread or messages are updated
        if (thread && thread.messages) {
            scrollToBottom();
        }
    }, [thread]);

    return (
        <div className="mt-6">
            {loading ? (
                <p>Loading thread...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p> // Display error if thread doesn't exist
            ) : thread ? (
                <>
                    <div
                        ref={scrollableDivRef}
                        className="overflow-y-auto max-h-[22rem] border p-4 rounded bg-gray-50"
                    >
                        <ul className="space-y-4">
                            {thread.messages.map((msg, index) => (
                                <li
                                    key={index}
                                    className={`flex items-start ${msg.role === "user" ? "justify-end" : "justify-start"
                                        }`}
                                >
                                    {/* Message Bubble */}
                                    <div
                                        className={`${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
                                            } p-4 rounded-lg max-w-xs shadow`}
                                        style={{ wordWrap: "break-word" }}
                                    >
                                        <p
                                            dangerouslySetInnerHTML={{
                                                __html: msg.content
                                                    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
                                                    .replace(/\n/g, "<br>"),
                                            }}
                                        ></p>
                                        <small className={`block mt-1 text-xs ${msg.role === "user" ? "text-gray-100" : "text-gray-600"}`}>
                                            {new Date(msg.createdAt.seconds * 1000).toLocaleString()}
                                        </small>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            ) : (
                <p>Start a thread with AIPS!</p>
            )}
        </div>
    );
};

export default AIThreadViewer;
