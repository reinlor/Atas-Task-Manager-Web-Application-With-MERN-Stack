import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

// Markdown Imports
import Markdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import axios from "axios";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, MoreIcon } from "../../component/Icons";
import { useTaskEditor } from "../../context/TaskEditorContext";
import Button from "../../component/Button";
import Modal from "../../component/Modal";
import TaskModal from "../../component/TaskModal";

const MARKDOWN_TYPOGRAPHY = `
    [&_h1]:text-h1 [&_h1]:font-semibold [&_h1]:mb-2 [&_h1]:mt-1
    [&_h2]:text-h2 [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-1
    [&_h3]:text-h3 [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-1
    [&_h4]:text-h4 [&_h4]:font-semibold [&_h4]:mb-2 [&_h4]:mt-1
    [&_h5]:text-h5 [&_h5]:font-semibold [&_h5]:mb-2 [&_h5]:mt-1
    [&_h6]:text-h6 [&_h6]:font-semibold [&_h6]:mb-2 [&_h6]:mt-1

    [&_p]:text-secondary [&_p]:mb-3 [&_p]:leading-relaxed
    [&_pre]:bg-[#161616] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:mb-3 [&_pre]:overflow-x-auto
    [&_hr]:border-divider [&_hr]:my-4

    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:text-secondary
    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:text-secondary
    [&_li]:mb-1

    [&_ul.contains-task-list]:list-none [&_ul.contains-task-list]:pl-0
    [&_li.task-list-item]:flex [&_li.task-list-item]:items-center [&_li.task-list-item]:gap-2
    [&_input[type="checkbox"]]:m-0 [&_input[type="checkbox"]]:cursor-pointer

    [&_a]:text-brand [&_a]:underline
    
    [&_code]:font-mono [&_code]:text-[13px] [&_code]:bg-[#161616] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded
    [&_blockquote]:border-l-2 [&_blockquote]:border-brand/50 [&_blockquote]:pl-3 [&_blockquote]:text-secondary [&_blockquote]:italic
    
    [&_table]:w-full [&_table]:text-sm [&_table]:mb-3
    [&_th]:border [&_th]:border-divider [&_th]:px-2 [&_th]:py-1 [&_th]:text-left
    [&_td]:border [&_td]:border-divider [&_td]:px-2 [&_td]:py-1

    [&_.math-display]:my-4 [&_.math-display]:overflow-x-auto
`;

const STATUS_STYLES = {
    "Pending": { dot: "bg-accent-color", text: "text-secondary" },
    "In Progress": { dot: "bg-brand", text: "text-brand" },
    "Complete": { dot: "bg-secondary", text: "text-secondary" },
};

function FadeIn({ children, className = "" }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const frame = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(frame);
    }, []);
    return (
        <div
            className={`transition-all duration-200 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                } ${className}`}
        >
            {children}
        </div>
    );
}

export default function Tasks() {
    const previewRef = useRef(null)
    const markdownRef = useRef(null)

    const { taskId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { registerActiveTask, clearActiveTask } = useTaskEditor();

    const [title, setTitle] = useState("");
    const [markdown, setMarkdown] = useState("");
    const [status, setStatus] = useState("Pending");

    const [team, setTeam] = useState(null);
    const [isOwner, setIsOwner] = useState(true);
    const [canEdit, setCanEdit] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [mobileEditorPane, setMobileEditorPane] = useState("markdown");
    const socketRef = useRef(null);
    const applyingRemoteChangeRef = useRef(false);
    const [mode, setMode] = useState(searchParams.get("new") === "true" ? "edit" : "view");

    // Delete confirmation
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [confirmModalData, setConfirmModalData] = useState({ title: '', content: '' })

    const [showTaskModal, setShowTaskModal] = useState(false)

    const canSave = (title ?? "").trim().length > 0;

    const saveTask = useCallback(async ({ quiet = false } = {}) => {
        if (!canSave || !canEdit) return;
        try {
            setIsSaving(true)
            const response = await axios.patch(
                `${import.meta.env.VITE_API_BASE_URL}/api/task/update/${taskId}`,
                { title, content: markdown, status },
                { withCredentials: true }
            )
            if (response.status === 200) {
                setIsDirty(false)
                if (!quiet) {
                    toast.success('Task updated')
                    setMode('view')
                }
            }
        } catch (err) {
            if (!quiet) toast.error(err.response?.data?.message || 'Update failed.')
        } finally {
            setIsSaving(false)
        }
    }, [canEdit, canSave, markdown, status, taskId, title]);

    const handleSaveTask = () => saveTask();

    const handleDelete = async () => {
        try {
            const response = await axios.delete(
                `${import.meta.env.VITE_API_BASE_URL}/api/task/delete/${taskId}`,
                { withCredentials: true }
            )
            if (response.status === 200) {
                toast.success('Task deleted')
                navigate('/task')
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Delete failed.')
        } finally {
            setShowConfirmModal(false)
        }
    }

    const handleConfirmModal = (title, content) => {
        setConfirmModalData({ title, content })
        setShowConfirmModal(true)
    }

    const handleShareTask = async (teamId) => {
        try {
            const response = await axios.patch(
                `${import.meta.env.VITE_API_BASE_URL}/api/task/update/${taskId}`,
                { team: teamId },
                { withCredentials: true }
            )
            setTeam(response.data.task?.team ?? null)
            toast.success(teamId ? 'Task shared' : 'Sharing stopped')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not update sharing.')
        }
    }

    useEffect(() => {
        const fetchTask = async () => {
            try {
                setIsLoading(true)
                const response = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL}/api/task/get/${taskId}`,
                    { withCredentials: true }
                )
                setTitle(response.data.title)
                setMarkdown(response.data.content)
                setStatus(response.data.status)
                setTeam(response.data.team ?? null)
                setIsOwner(Boolean(response.data.isOwner))
                setCanEdit(Boolean(response.data.canEdit))
                setIsDirty(false)
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to load task.')
            } finally {
                setIsLoading(false)
            }
        }
        fetchTask();
    }, [taskId])

    useEffect(() => {
        if (isLoading || !taskId) return;

        const socket = io(import.meta.env.VITE_API_BASE_URL, { withCredentials: true });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('join_task', taskId, (result) => {
                if (result?.error) toast.error(result.error);
            });
        });
        socket.on('task_presence', ({ users }) => setParticipants(users ?? []));
        socket.on('task_change', (change) => {
            applyingRemoteChangeRef.current = true;
            if (typeof change.title === 'string') setTitle(change.title);
            if (typeof change.content === 'string') setMarkdown(change.content);
            if (typeof change.status === 'string') setStatus(change.status);
            setIsDirty(false);
            applyingRemoteChangeRef.current = false;
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setParticipants([]);
        };
    }, [isLoading, taskId]);

    useEffect(() => {
        if (!isDirty || isLoading || mode !== 'edit' || !canEdit) return;

        const saveTimer = setTimeout(() => saveTask({ quiet: true }), 800);
        return () => clearTimeout(saveTimer);
    }, [isDirty, isLoading, mode, canEdit, saveTask]);

    const broadcastChange = (change) => {
        if (applyingRemoteChangeRef.current) return;
        setIsDirty(true);
        socketRef.current?.emit('task_change', change);
    };

    const handleEditing = (editing) => {
        socketRef.current?.emit('task_editing', editing);
    };

    useEffect(() => {
        if (!isLoading && !canEdit && mode === 'edit') setMode('view');
    }, [isLoading, canEdit, mode]);

    useEffect(() => {
        if (isLoading) return;
        registerActiveTask({
            taskId,
            getSnapshot: () => ({ title, content: markdown, status }),
            applyContent: (newContent) => setMarkdown(newContent),
        });
        return () => clearActiveTask();
    }, [taskId, title, markdown, status, isLoading, registerActiveTask, clearActiveTask]);

    if (isLoading) {
        return <p className="text-secondary text-sm">Loading task…</p>;
    }

    const sanitizeOptions = {
        ...defaultSchema,
        attributes: {
            ...defaultSchema.attributes,
            div: [...(defaultSchema.attributes?.div || []), ['className', 'math', 'math-display']],
            span: [...(defaultSchema.attributes?.span || []), ['className', 'math', 'math-inline', 'katex', 'katex-mathml', 'katex-html']],
        },
    };
    
    const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.Pending;
    
    // Logic to capture and highlight selected word on edit
    // FIXME: Enhance the overall logic of capturing text
    const handleTextareaSelect = () => {
        const textarea = markdownRef.current;
        const previewDiv = previewRef.current;
        if (!textarea || !previewDiv) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end).trim();
        if (!selectedText) return;

        // attempts to remove/strip basic md
        console.log('Text: ', selectedText)
        const cleanText = selectedText.replace(/[*_~#`>]/g, "").trim();
        console.log('Clean Text: ', cleanText)
        if (!cleanText) return;

        const treeWalker = document.createTreeWalker(
            previewDiv,
            NodeFilter.SHOW_TEXT,
            null
        );

        let currentNode = treeWalker.nextNode();
        let targetNode = null;
        let targetOffset = -1;

        while (currentNode) {
            const matchIndex = currentNode.nodeValue.indexOf(cleanText);
            if (matchIndex !== -1) {
                targetNode = currentNode;
                targetOffset = matchIndex;
                break;
            }
            currentNode = treeWalker.nextNode();
        }

        if (targetNode) {
            const range = document.createRange();

            range.setStart(targetNode, targetOffset);
            range.setEnd(targetNode, targetOffset + cleanText.length);

            if (range.startContainer.parentElement) {
                range.startContainer.parentElement.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                });
            }
        }
    };

    // preview to textarea (nasa edit mode)
    const handlePreviewSelect = () => {
        const textarea = markdownRef.current;
        if (!textarea) return;

        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        if (!selectedText) return;

        const matchIndex = markdown.indexOf(selectedText);

        if (matchIndex !== -1) {
            textarea.focus();
            textarea.setSelectionRange(matchIndex, matchIndex + selectedText.length);

            const lineHeight = 20;
            const linesBeforeMatch = markdown.substring(0, matchIndex).split("\n").length;
            textarea.scrollTop = (linesBeforeMatch - 2) * lineHeight;
        }
    };


    return (
        <div className="flex flex-col h-full">
            <Modal
                title={confirmModalData.title}
                content={confirmModalData.content}
                display={showConfirmModal}
                onConfirm={handleDelete}
                onCancel={() => setShowConfirmModal(false)}
            />

            <TaskModal
                display={showTaskModal}
                onClose={() => setShowTaskModal(false)}
                isOwner={isOwner}
                currentTeamId={team}
                onShare={handleShareTask}
                onUnshare={() => handleShareTask(null)}
                onDeleteRequest={() => handleConfirmModal(
                    'Delete task',
                    `Are you sure you want to delete "${title}"? This can't be undone.`
                )}
            />

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/task')}
                        className="text-sm text-secondary hover:text-primary transition-colors cursor-pointer"
                    >
                        ← Back to tasks
                    </button>
                    {!isOwner && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/30">
                            Shared
                        </span>
                    )}
                    {participants.length > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] text-secondary">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                            {participants.length} in room
                            {participants.some((participant) => participant.editing) && (
                                <span className="text-brand">
                                    · {participants.filter((participant) => participant.editing).map((participant) => participant.username).join(', ')} editing
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:gap-3">
                    <div className="relative inline-flex items-center bg-input border border-divider rounded-lg p-1">
                        <div
                            className="absolute top-1 bottom-1 rounded-md bg-brand transition-all duration-200 ease-out"
                            style={{
                                width: canEdit ? "calc(50% - 4px)" : "calc(100% - 8px)",
                                left: mode === "view" ? "4px" : "50%",
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setMode('view')}
                            className={`relative z-10 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${mode === 'view' ? 'text-main' : 'text-secondary hover:text-primary'
                                }`}
                        >
                            View
                        </button>
                        {canEdit && (
                            <button
                                type="button"
                                onClick={() => setMode('edit')}
                                className={`relative z-10 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${mode === 'edit' ? 'text-main' : 'text-secondary hover:text-primary'
                                    }`}
                            >
                                Edit
                            </button>
                        )}
                    </div>

                    {isOwner && (
                        <button
                            type="button"
                            onClick={() => setShowTaskModal(true)}
                            aria-label="More actions"
                            className="w-9 h-9 rounded-lg border border-divider text-secondary hover:text-primary hover:bg-main transition-colors cursor-pointer flex items-center justify-center"
                        >
                            <MoreIcon className="w-4 h-4" />
                        </button>
                    )}

                    {mode === 'edit' && canEdit && (
                        <FadeIn key="save-button" className="inline-block">
                            <Button
                                type="button"
                                onClick={handleSaveTask}
                                disabled={isSaving || !canSave}
                                title={!canSave ? 'Title is required' : undefined}
                                cstyle="px-4 py-2 rounded-lg text-sm font-semibold bg-brand text-main hover:brightness-110 active:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isSaving ? 'Saving…' : isDirty ? 'Save' : 'Saved'}
                            </Button>
                        </FadeIn>
                    )}
                </div>
            </div>

            {mode === 'view' ? (
                <FadeIn key="view" className="max-w-3xl mx-auto w-full">
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <h1 className="min-w-0 wrap-break-word text-xl font-semibold text-primary sm:text-2xl">{title}</h1>
                        <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-input border border-divider ${statusStyle.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                            {status}
                        </span>
                    </div>
                    <div className={` text-primary text-base ${MARKDOWN_TYPOGRAPHY}`}>
                        <Markdown
                            remarkPlugins={[[
                                remarkGfm, { singleTilde: false }],
                                remarkMath
                            ]}
                            rehypePlugins={[
                                rehypeHighlight,
                                [rehypeSanitize, sanitizeOptions],
                                rehypeKatex]}>
                            {markdown}
                        </Markdown>
                    </div>
                </FadeIn>
            ) : (
                <FadeIn key="edit" className="flex flex-col flex-1 min-h-0">
                    <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-start">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                broadcastChange({ title: e.target.value });
                            }}
                            onFocus={() => handleEditing(true)}
                            onBlur={() => handleEditing(false)}
                            maxLength={150}
                            placeholder="Untitled task"
                            className="min-w-0 flex-1 bg-transparent text-xl font-semibold text-primary placeholder-accent-color/60 outline-none border-b border-divider focus:border-brand pb-2 transition-colors sm:text-2xl"
                        />
                        <div className="relative shrink-0">
                            <select
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value);
                                    broadcastChange({ title, content: markdown, status: e.target.value });
                                }}
                                onFocus={() => handleEditing(true)}
                                onBlur={() => handleEditing(false)}
                                className="w-full appearance-none bg-input border border-divider rounded-lg pl-3 pr-8 py-2 text-sm text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 cursor-pointer sm:w-auto"
                            >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Complete">Complete</option>
                            </select>
                            <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-color" />
                        </div>
                    </div>

                    <div className="flex-1 min-h-0">
                        <div className="mb-3 flex items-center justify-between gap-3 md:hidden">
                            <button
                                type="button"
                                onClick={() => setMobileEditorPane("markdown")}
                                disabled={mobileEditorPane === "markdown"}
                                aria-label="Show markdown editor"
                                className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-divider text-secondary hover:text-primary hover:bg-input disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                            <span className="text-[11px] uppercase tracking-widest text-accent-color">
                                {mobileEditorPane === "markdown" ? "Markdown" : "Preview"}
                            </span>
                            <button
                                type="button"
                                onClick={() => setMobileEditorPane("preview")}
                                disabled={mobileEditorPane === "preview"}
                                aria-label="Show markdown preview"
                                className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-divider text-secondary hover:text-primary hover:bg-input disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                                <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid h-full grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`${mobileEditorPane === "markdown" ? "flex" : "hidden"} md:flex flex-col rounded-xl border border-divider bg-input overflow-hidden`}>
                            <p className="px-4 py-2 text-[11px] uppercase tracking-widest text-accent-color border-b border-divider">
                                Markdown
                            </p>
                            <textarea
                                ref={markdownRef}
                                value={markdown}
                                onChange={(e) => {
                                    setMarkdown(e.target.value);
                                    broadcastChange({ content: e.target.value });
                                }}
                                onFocus={() => handleEditing(true)}
                                onBlur={() => handleEditing(false)}
                                onSelect={handleTextareaSelect}
                                placeholder="Start writing..."
                                className="flex-1 resize-none bg-transparent p-4 text-sm font-mono text-primary placeholder-accent-color/70 outline-none focus:ring-2 focus:ring-inset focus:ring-brand/30"
                            />
                        </div>

                        <div className={`${mobileEditorPane === "preview" ? "flex" : "hidden"} md:flex flex-col rounded-xl border border-divider bg-main overflow-hidden`}>
                            <p className="px-4 py-2 text-[11px] uppercase tracking-widest text-accent-color border-b border-divider">
                                Preview
                            </p>
                            <div
                                ref={previewRef}
                                onMouseUp={handlePreviewSelect}
                                className={`flex-1 overflow-y-auto p-4 text-primary text-sm ${MARKDOWN_TYPOGRAPHY}`}>
                                <Markdown
                                    remarkPlugins={[[
                                        remarkGfm, { singleTilde: false }],
                                        remarkMath
                                    ]}
                                    rehypePlugins={[
                                        rehypeHighlight,
                                        [rehypeSanitize, sanitizeOptions],
                                        rehypeKatex]}>
                                    {markdown}
                                </Markdown>
                            </div>
                        </div>
                        </div>
                    </div>
                </FadeIn>
            )}
        </div>
    );
}