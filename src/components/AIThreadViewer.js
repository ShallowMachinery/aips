import React, { useEffect, useState, useRef } from "react";
import { FaCopy, FaCheck } from "react-icons/fa";
import { getAIThread } from "../firebase";

const AIThreadViewer = ({ threadId, refreshThread }) => {
    const [thread, setThread] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [copyTimeout, setCopyTimeout] = useState(null);

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
        if (thread && thread.messages) {
            scrollToBottom();
        }
    }, [thread]);

    const handleCopyToClipboard = (content) => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setCopyTimeout(setTimeout(() => setCopied(false), 10000));
        return () => clearTimeout(copyTimeout);
    };

    return (
        <div>
            {loading ? (
                <p>Loading thread...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : thread ? (
                <>
                    <div
                        ref={scrollableDivRef}
                        className="overflow-y-auto h-[30rem] border p-4 rounded bg-gray-50"
                    >
                        <ul className="space-y-4">
                            {thread.messages.map((msg, index) => (
                                <li
                                    key={index}
                                    className={`flex items-start ${msg.role === "user" ? "justify-end" : "justify-start"
                                        }`}
                                >
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
                                        <div className="flex items-center justify-between">
                                            <small className={`block mt-1 text-xs ${msg.role === "user" ? "text-gray-100" : "text-gray-600"}`}>
                                                {new Date(msg.createdAt.seconds * 1000).toLocaleString()}
                                            </small>
                                            <button
                                                className={`${!copied ? "hover:text-gray-800" : ""}`}
                                                title={`${!copied ? "Copy this to clipboard" : "Copied!"}`}
                                                onClick={() => handleCopyToClipboard(msg.content)}
                                                disabled={copied}
                                            >
                                                {copied ? <FaCheck /> : <FaCopy />}
                                            </button>
                                        </div>

                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            ) : (
                <div className="h-[30rem] flex items-center justify-center">
                    <p className="text-center text-lg font-bold">Start a thread with AIPS!</p>
                </div>
            )
            }
        </div >
    );
};

export default AIThreadViewer;
