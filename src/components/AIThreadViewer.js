import React, { useEffect, useState, useRef } from "react";
import { FaCopy, FaCheck } from "react-icons/fa";
import { getAIThread } from "../firebase";

// Function to format markdown content
const formatMarkdown = (content) => {
    if (!content) return '';
    
    let formatted = content;
    
    // Horizontal rules (do this first, before headers)
    formatted = formatted.replace(/^---\s*$/gm, "<hr class='border-neon-purple/30 my-4' />");
    formatted = formatted.replace(/^___\s*$/gm, "<hr class='border-neon-purple/30 my-4' />");
    formatted = formatted.replace(/^\*\*\*\s*$/gm, "<hr class='border-neon-purple/30 my-4' />");
    
    // Headers (must be done before other formatting)
    formatted = formatted.replace(/^### (.+?)$/gm, "<h3 class='text-lg font-bold text-neon-purple mt-4 mb-2'>$1</h3>");
    formatted = formatted.replace(/^## (.+?)$/gm, "<h2 class='text-xl font-bold text-neon-purple mt-4 mb-3'>$1</h2>");
    formatted = formatted.replace(/^# (.+?)$/gm, "<h1 class='text-2xl font-bold text-neon-blue mt-5 mb-3'>$1</h1>");
    
    // Split into lines to process paragraphs
    const lines = formatted.split('\n');
    const processedLines = [];
    let currentParagraph = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // If line is already HTML (header, hr), add it directly
        if (line.match(/^<(h[1-6]|hr)/)) {
            if (currentParagraph.length > 0) {
                processedLines.push(`<p class='mb-3'>${currentParagraph.join(' ')}</p>`);
                currentParagraph = [];
            }
            processedLines.push(line);
        }
        // If empty line, end current paragraph
        else if (line.trim() === '') {
            if (currentParagraph.length > 0) {
                processedLines.push(`<p class='mb-3'>${currentParagraph.join(' ')}</p>`);
                currentParagraph = [];
            }
        }
        // Otherwise, add to current paragraph
        else {
            currentParagraph.push(line);
        }
    }
    
    // Add remaining paragraph
    if (currentParagraph.length > 0) {
        processedLines.push(`<p class='mb-3'>${currentParagraph.join(' ')}</p>`);
    }
    
    formatted = processedLines.join('');
    
    // Bold text (handle both **text** and __text__) - do this before italic
    formatted = formatted.replace(/\*\*([^*]+?)\*\*/g, "<strong class='text-neon-blue font-semibold'>$1</strong>");
    formatted = formatted.replace(/__([^_]+?)__/g, "<strong class='text-neon-blue font-semibold'>$1</strong>");
    
    // Italic text (single asterisk/underscore that's not part of bold)
    // Use a simple approach: replace single * or _ that aren't adjacent to another
    formatted = formatted.replace(/([^*])\*([^*\n]+?)\*([^*])/g, "$1<em class='text-gray-300'>$2</em>$3");
    formatted = formatted.replace(/([^_])_([^_\n]+?)_([^_])/g, "$1<em class='text-gray-300'>$2</em>$3");
    
    // Code blocks (inline)
    formatted = formatted.replace(/`([^`]+)`/g, "<code class='bg-cyber-darker px-1.5 py-0.5 rounded text-neon-blue font-mono text-sm'>$1</code>");
    
    return formatted;
};

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
        <div className="flex-1 flex flex-col overflow-hidden">
            {loading ? (
                <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-cyber-darker to-black border border-neon-blue/30">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-blue mb-4"></div>
                        <p className="text-gray-300 font-semibold">Loading conversation...</p>
                        <p className="text-gray-500 text-sm mt-2">Fetching your chat history</p>
                    </div>
                </div>
            ) : error ? (
                <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-cyber-darker to-black border border-red-500/30">
                    <div className="text-center p-6">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <p className="text-red-400 font-semibold">{error}</p>
                    </div>
                </div>
            ) : thread ? (
                <>
                    <div
                        ref={scrollableDivRef}
                        className="overflow-y-auto border border-neon-blue/30 p-4 bg-gradient-to-b from-cyber-darker to-black flex-1"
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#00f0ff #0a0e27',
                            height: '100%'
                        }}
                    >
                        <ul className="space-y-4">
                            {thread.messages.map((msg, index) => (
                                <li
                                    key={index}
                                    className={`flex items-start gap-3 animate-slide-up ${msg.role === "user" ? "justify-end" : "justify-start"
                                        }`}
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                >
                                    {/* Avatar indicator - only show for AI on left */}
                                    {msg.role === "ai" && (
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-r from-neon-purple to-neon-pink text-white">
                                            AI
                                        </div>
                                    )}
                                    
                                    <div
                                        className={`${msg.role === "user" 
                                            ? "bg-gradient-to-r from-neon-blue to-neon-purple text-white border border-neon-blue/50 shadow-lg shadow-neon-blue/20" 
                                            : "bg-cyber-blue/80 text-white border border-neon-purple/50 shadow-lg shadow-neon-purple/20 backdrop-blur-sm"
                                            } p-4 rounded-2xl max-w-md shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]`}
                                        style={{ wordWrap: "break-word" }}
                                    >
                                        {/* Show reasoning if available (only for AI messages) */}
                                        {msg.role === "ai" && msg.reasoning && (
                                            <div className="mb-4 p-3 bg-cyber-darker/80 border border-neon-purple/30 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-bold text-neon-purple uppercase tracking-wide">Reasoning</span>
                                                </div>
                                                <p className="text-gray-300 text-xs leading-relaxed italic">{msg.reasoning}</p>
                                            </div>
                                        )}
                                        
                                        <div
                                            className="text-white leading-relaxed prose prose-invert prose-headings:text-neon-blue prose-strong:text-neon-blue"
                                            style={{ 
                                                lineHeight: '1.6',
                                                fontSize: '0.95rem'
                                            }}
                                            dangerouslySetInnerHTML={{
                                                __html: formatMarkdown(msg.content),
                                            }}
                                        ></div>
                                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                                            <small className={`block text-xs ${msg.role === "user" ? "text-gray-200" : "text-gray-400"}`}>
                                                {new Date(msg.createdAt.seconds * 1000).toLocaleString()}
                                            </small>
                                            <button
                                                className={`ml-2 p-1.5 rounded-lg transition-all duration-300 ${
                                                    copied 
                                                        ? "text-green-400 bg-green-400/20" 
                                                        : "text-gray-400 hover:text-neon-blue hover:bg-neon-blue/20"
                                                }`}
                                                title={`${!copied ? "Copy this to clipboard" : "Copied!"}`}
                                                onClick={() => handleCopyToClipboard(msg.content)}
                                                disabled={copied}
                                            >
                                                {copied ? <FaCheck size={14} /> : <FaCopy size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* Avatar indicator - only show for user on right */}
                                    {msg.role === "user" && (
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-r from-neon-blue to-neon-purple text-white">
                                            U
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-cyber-darker to-black border border-neon-blue/30">
                    <div className="text-center p-8">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center animate-pulse-neon">
                            <span className="text-3xl">✨</span>
                        </div>
                        <p className="text-xl font-bold text-gray-300 mb-2 font-['Orbitron']">Start a conversation with AIPS!</p>
                        <p className="text-sm text-gray-500">Ask for help with your story, get suggestions, or brainstorm ideas.</p>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default AIThreadViewer;
