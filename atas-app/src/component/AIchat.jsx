import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { diffLines } from "diff";
import { SparkleIcon, XIcon, SendIcon } from "./Icons";
import { useTaskEditor } from "../context/TaskEditorContext";


function stripCodeFence(text = "") {
    return text.replace(/^```(?:markdown)?\n?/, "").replace(/```\s*$/, "").trim();
}

function deriveTitleFromMarkdown(markdown = "") {
    const firstLine = markdown.split("\n").find((line) => line.trim().length > 0);
    if (!firstLine) return "";
    return firstLine.replace(/^#+\s*/, "").trim();
}

async function requestAIMarkdown(prompt) {
    const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/ai/generate`,
        { prompt },
        { withCredentials: true }
    );
    return stripCodeFence(response.data.markdown);
}

function TypingIndicator() {
    return (
        <div className="flex items-center gap-1 bg-[#161616] border border-divider rounded-2xl rounded-bl-sm px-3 py-2.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-color animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-accent-color animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-accent-color animate-bounce" />
        </div>
    );
}


function DiffView({ parts }) {
    return (
        <div className="font-mono text-xs leading-relaxed rounded-lg border border-divider bg-main p-3 max-h-48 overflow-y-auto">
            {parts.map((part, i) => {
                const lines = part.value.split("\n").filter((line, idx, arr) => !(idx === arr.length - 1 && line === ""));
                const tone = part.added ? "added" : part.removed ? "removed" : "same";
                return lines.map((line, j) => (
                    <div
                        key={`${i}-${j}`}
                        className={
                            tone === "added"
                                ? "bg-success/10 text-success"
                                : tone === "removed"
                                    ? "bg-danger/10 text-danger line-through decoration-danger/50"
                                    : "text-secondary"
                        }
                    >
                        <span className="select-none mr-2 text-accent-color">
                            {tone === "added" ? "+" : tone === "removed" ? "-" : " "}
                        </span>
                        {line || "\u00A0"}
                    </div>
                ));
            })}
        </div>
    );
}

function ChatBubble({ message, onUseSuggestion, onApplyDiff, onDiscardDiff }) {
    const isUser = message.role === "user";

    if (message.type === "task-suggestion") {
        return (
            <div className="flex flex-col gap-2 bg-[#161616] border border-divider rounded-2xl rounded-bl-sm p-3 max-w-[90%]">
                <p className="text-secondary text-sm">Here's what I put together:</p>
                <div className="bg-input border border-divider rounded-lg p-3">
                    <p className="text-primary text-sm font-medium truncate">{message.suggestion.title}</p>
                    <p className="text-secondary text-xs mt-1 line-clamp-3">{message.suggestion.content}</p>
                </div>
                <button
                    type="button"
                    onClick={() => onUseSuggestion(message.suggestion)}
                    className="self-start text-sm font-medium text-brand hover:brightness-110 transition cursor-pointer"
                >
                    Use this task →
                </button>
            </div>
        );
    }

    if (message.type === "task-diff") {
        if (message.dismissed) {
            return (
                <div className="bg-[#161616] border border-divider rounded-2xl rounded-bl-sm px-3 py-2.5 max-w-[90%] text-secondary text-sm italic">
                    Change discarded.
                </div>
            );
        }
        return (
            <div className="flex flex-col gap-2 bg-[#161616] border border-divider rounded-2xl rounded-bl-sm p-3 max-w-[95%]">
                <p className="text-secondary text-sm">Here's what would change:</p>
                <DiffView parts={message.diff.parts} />
                <div className="flex gap-3 mt-1">
                    <button
                        type="button"
                        onClick={() => onApplyDiff(message.diff)}
                        className="text-sm font-medium text-brand hover:brightness-110 transition cursor-pointer"
                    >
                        Apply changes
                    </button>
                    <button
                        type="button"
                        onClick={() => onDiscardDiff(message.id)}
                        className="text-sm text-accent-color hover:text-primary transition-colors cursor-pointer"
                    >
                        Discard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`max-w-[85%] text-sm px-3 py-2 rounded-2xl ${isUser
                ? "ml-auto bg-brand text-main rounded-br-sm"
                : "bg-[#161616] border border-divider text-primary rounded-bl-sm"
                }`}
        >
            {message.text}
        </div>
    );
}

export default function Aichat() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const bottomRef = useRef(null);
    const navigate = useNavigate();

    const textareaRef = useRef(null);

    const { getActiveTask } = useTaskEditor();

    useEffect(() => {
        if (open && messages.length === 0) {
            const active = getActiveTask();
            setMessages([
                {
                    id: "greeting",
                    role: "assistant",
                    type: "text",
                    text: active
                        ? "I can help add to or rewrite this task. Tell me what to change, and I'll show you what's different before anything's applied."
                        : "Hi! Tell me what you need to get done, in plain language — I'll turn it into a markdown task for you.",
                },
            ]);
        }
    }, [open, messages.length, getActiveTask]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isThinking]);

    // Logic for automatic resizing
    useEffect(() => {
        if (open && textareaRef.current) {
            const timer = setTimeout(() => {
                const textRef = textareaRef.current;
                if (textRef) {
                    textRef.style.height = "auto";

                    textRef.style.height = `${textRef.scrollHeight}px`;
                }
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [open]);
    const handleInputChange = (e) => {
        const textArea = e.target;
        setInput(textArea.value);

        // re-assign default val incase text revert or became shorter again
        textArea.style.height = "auto";
        textArea.style.overflowY = "hidden";

        textArea.style.height = `${textArea.scrollHeight}px`;

        // Scrollbar shows after exceedin client height
        if (textArea.scrollHeight -2 > textArea.clientHeight) {
            textArea.style.overflowY = "auto";
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || isThinking) return;

        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", type: "text", text }]);
        setInput("");
        setIsThinking(true);

        const active = getActiveTask();
        const snapshot = active?.getSnapshot();

        try {
            const prompt = active
                ? snapshot.content?.trim()
                    ? `Current task content:\n\n${snapshot.content}\n\n---\n\nRequested change: "${text}"\n\nReturn the FULL updated markdown content, incorporating this change. Keep everything that should stay the same, and only change what's needed.`
                    : `Requested content: "${text}"\n\nReturn markdown content for this task based on the request.`
                : text;

            const newMarkdown = await requestAIMarkdown(prompt);

            if (active) {
                const oldContent = snapshot.content || "";
                setMessages((prev) => [
                    ...prev,
                    {
                        id: crypto.randomUUID(),
                        role: "assistant",
                        type: "task-diff",
                        dismissed: false,
                        diff: { taskId: active.taskId, newContent: newMarkdown, parts: diffLines(oldContent, newMarkdown) },
                    },
                ]);
            } else {
                const title = deriveTitleFromMarkdown(newMarkdown) || (text.length > 60 ? text.slice(0, 57) + "…" : text);
                setMessages((prev) => [
                    ...prev,
                    { id: crypto.randomUUID(), role: "assistant", type: "task-suggestion", suggestion: { title, content: newMarkdown } },
                ]);
            }
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { id: crypto.randomUUID(), role: "assistant", type: "text", text: err.response?.data?.error || "Sorry, I couldn't generate that — try again?" },
            ]);
        } finally {
            setIsThinking(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };

    const handleUseSuggestion = async (suggestion) => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/task/create`,
                { title: suggestion.title, content: suggestion.content, status: "Pending" },
                { withCredentials: true }
            );
            setOpen(false);
            navigate(`/task/${response.data._id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Could not create the task.");
        }
    };

    const handleApplyDiff = (diff) => {
        const active = getActiveTask();
        if (active && active.taskId === diff.taskId) {
            active.applyContent(diff.newContent);
            toast.success("Applied to the editor — hit Save to keep it.");
            setOpen(false);
        } else {
            toast.error("That task isn't open anymore — reopen it to apply this change.");
        }
    };

    const handleDiscardDiff = (messageId) => {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, dismissed: true } : m)));
    };

    return (
        <aside className="fixed bottom-20 right-3 z-40 flex flex-col items-end sm:bottom-12 sm:right-6">
            <div
                className={`mb-3 max-w-[calc(100vw-3rem)]  max-h-[70vh] origin-bottom-right
                    bg-input border border-divider rounded-2xl shadow-2xl shadow-black/40
                    flex flex-col overflow-hidden transition-all duration-150
                    ${open ? "opacity-100 scale-100 pointer-events-auto w-[calc(100vw-1.5rem)] h-[min(30rem,calc(100vh-6rem))] sm:w-90 sm:h-120" : "opacity-0 scale-95 pointer-events-none w-2 h-2"}`}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-divider bg-[#161616] shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-brand/15 border border-brand/30 flex items-center justify-center">
                            <SparkleIcon className="w-3.5 h-3.5 text-brand" />
                        </span>
                        <div>
                            <p className="text-sm font-medium text-primary leading-none">Task Assistant</p>
                            <p className="text-[11px] text-accent-color mt-0.5">Describe it, I'll write it</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        aria-label="Close assistant"
                        className="text-accent-color hover:text-primary transition-colors cursor-pointer"
                    >
                        <XIcon className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                    {messages.map((message) => (
                        <ChatBubble
                            key={message.id}
                            message={message}
                            onUseSuggestion={handleUseSuggestion}
                            onApplyDiff={handleApplyDiff}
                            onDiscardDiff={handleDiscardDiff}
                        />
                    ))}
                    {isThinking && <TypingIndicator />}
                    <div ref={bottomRef} />
                </div>

                <form onSubmit={handleSend} className="flex items-end gap-2 p-3 border-t border-divider shrink-0">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        placeholder="e.g. Prep slides for Friday's demo"
                        className="flex-1 overflow-y-hidden resize-none bg-main border border-divider rounded-lg px-3 py-2 text-sm text-primary placeholder-accent-color/70 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 max-h-24"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isThinking}
                        aria-label="Send"
                        className="shrink-0 w-9 h-9 rounded-lg bg-brand text-main flex items-center justify-center hover:brightness-110 active:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                        <SendIcon className="w-4 h-4" />
                    </button>
                </form>
            </div>

            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                aria-label={open ? "Close task assistant" : "Open task assistant"}
                className={`w-14 h-14 rounded-full bg-brand text-main shadow-lg shadow-black/40 flex items-center justify-center hover:brightness-110 active:brightness-95 transition cursor-pointer
                        ${ !open ? 'opacity-30 transition-opacity duration-300 ease-in-out hover:opacity-100' : ''}
                    `}
            >
                {open ? <XIcon className="w-5 h-5" /> : <SparkleIcon className="w-6 h-6" />}
            </button>
        </aside>
    );
}