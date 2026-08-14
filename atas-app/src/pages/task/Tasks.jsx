import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Markdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import rehypeSanitize from 'rehype-sanitize';
import axios from "axios";
import { toast } from "react-toastify";
import { ChevronDownIcon } from "../../component/Icons";

const MARKDOWN_TYPOGRAPHY = `
    [&_h1]:text-h1 [&_h1]:font-semibold [&_h1]:mb-2 [&_h1]:mt-1
    [&_h2]:text-h2 [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-1
    [&_h3]:text-h3 [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-1
    [&_h4]:text-h4 [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-1
    [&_h5]:text-h5 [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-1
    [&_h6]:text-h6 [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-1

    [&_p]:text-secondary [&_p]:mb-3 [&_p]:leading-relaxed
    [&_pre]:bg-[#161616] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:mb-3 [&_pre]:overflow-x-auto
    [&_hr]:border-divider [&_hr]:my-4

    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:text-secondary
    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:text-secondary
    [&_li]:mb-1

    [&_a]:text-[var(--color-brand)] [&_a]:underline
    
    [&_code]:font-mono [&_code]:text-[13px] [&_code]:bg-[#161616] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded
    [&_blockquote]:border-l-2 [&_blockquote]:border-[var(--color-brand)]/50 [&_blockquote]:pl-3 [&_blockquote]:text-secondary [&_blockquote]:italic
    
    [&_table]:w-full [&_table]:text-sm [&_table]:mb-3
    [&_th]:border [&_th]:border-divider [&_th]:px-2 [&_th]:py-1 [&_th]:text-left
    [&_td]:border [&_td]:border-divider [&_td]:px-2 [&_td]:py-1
`;

const STATUS_STYLES = {
    "Pending": { dot: "bg-[var(--color-accent-color)]", text: "text-secondary" },
    "In Progress": { dot: "bg-[var(--color-brand)]", text: "text-[var(--color-brand)]" },
    "Complete": { dot: "bg-secondary", text: "text-secondary" },
};

export default function Tasks() {
    const { taskId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [title, setTitle] = useState("");
    const [markdown, setMarkdown] = useState("");
    const [status, setStatus] = useState("Pending");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [mode, setMode] = useState(searchParams.get("new") === "true" ? "edit" : "view");

    const canSave = (title ?? "").trim().length > 0;

    const handleSaveTask = async () => {
        try {
            setIsSaving(true)
            const response = await axios.patch(
                `${import.meta.env.VITE_API_BASE_URL}/api/task/update/${taskId}`,
                { title, content: markdown, status },
                { withCredentials: true }
            )
            if (response.status === 200) {
                toast.success('Task updated')
                setMode('view')
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Update failed.')
        } finally {
            setIsSaving(false)
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
                console.log(response)
                setTitle(response.data.title)
                setMarkdown(response.data.content)
                setStatus(response.data.status)
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to load task.')
            } finally {
                setIsLoading(false)
            }
        }
        fetchTask();
    }, [taskId])

    if (isLoading) {
        return <p className="text-secondary text-sm">Loading task…</p>;
    }

    const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.Pending;

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-5">
                <button
                    type="button"
                    onClick={() => navigate('/task')}
                    className="text-sm text-secondary hover:text-primary transition-colors cursor-pointer"
                >
                    ← Back to tasks
                </button>

                <div className="flex items-center gap-3">
                    <div className="inline-flex items-center bg-input border border-divider rounded-lg p-1">
                        <button
                            type="button"
                            onClick={() => setMode('view')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                                mode === 'view'
                                    ? 'bg-brand text-main'
                                    : 'text-secondary hover:text-primary'
                            }`}
                        >
                            View
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('edit')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                                mode === 'edit'
                                    ? 'bg-brand text-main'
                                    : 'text-secondary hover:text-primary'
                            }`}
                        >
                            Edit
                        </button>
                    </div>

                    {mode === 'edit' && (
                        <button
                            type="button"
                            onClick={handleSaveTask}
                            disabled={isSaving || !canSave}
                            title={!canSave ? 'Title is required' : undefined}
                            className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand text-main hover:brightness-110 active:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isSaving ? 'Saving…' : 'Save'}
                        </button>
                    )}
                </div>
            </div>

            {mode === 'view' ? (
                <div className="max-w-3xl mx-auto w-full">
                    <div className="flex items-center gap-3 mb-6">
                        <h1 className="text-2xl font-semibold text-primary">{title}</h1>
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-input border border-divider ${statusStyle.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                            {status}
                        </span>
                    </div>
                    <div className={`text-primary text-base ${MARKDOWN_TYPOGRAPHY}`}>
                        <Markdown
                            remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
                            rehypePlugins={[rehypeHighlight, rehypeSanitize]}>
                            {markdown}
                        </Markdown>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col flex-1 min-h-0">
                    {/* Title + status live above the split editor, matching where
                        they appear in view mode — switching modes shouldn't feel
                        like landing on a different page. */}
                    <div className="flex items-start gap-3 mb-4">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={150}
                            placeholder="Untitled task"
                            className="flex-1 bg-transparent text-2xl font-semibold text-primary placeholder-accent-color/60 outline-none border-b border-divider focus:border-brand pb-2 transition-colors"
                        />
                        <div className="relative shrink-0">
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="appearance-none bg-input border border-divider rounded-lg pl-3 pr-8 py-2 text-sm text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 cursor-pointer"
                            >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Complete">Complete</option>
                            </select>
                            <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-color" />
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                        <div className="flex flex-col rounded-xl border border-divider bg-input overflow-hidden">
                            <p className="px-4 py-2 text-[11px] uppercase tracking-widest text-accent-color border-b border-divider">
                                Markdown
                            </p>
                            <textarea
                                value={markdown}
                                onChange={(e) => setMarkdown(e.target.value)}
                                placeholder="Start writing..."
                                className="flex-1 resize-none bg-transparent p-4 text-sm font-mono text-primary placeholder-accent-color/70 outline-none focus:ring-2 focus:ring-inset focus:ring-brand/30"
                            />
                        </div>

                        <div className="flex flex-col rounded-xl border border-divider bg-main overflow-hidden">
                            <p className="px-4 py-2 text-[11px] uppercase tracking-widest text-accent-color border-b border-divider">
                                Preview
                            </p>
                            <div className={`flex-1 overflow-y-auto p-4 text-primary text-sm ${MARKDOWN_TYPOGRAPHY}`}>
                                <Markdown
                                    remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
                                    rehypePlugins={[rehypeHighlight, rehypeSanitize]}>
                                    {markdown}
                                </Markdown>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}