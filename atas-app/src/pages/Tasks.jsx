import { useState, useEffect } from "react";
import Markdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import rehypeSanitize from 'rehype-sanitize';
import axios from "axios";
import { toast } from "react-toastify";
import Button from "../component/Button"

export default function Tasks() {
    const [markdown, setMarkdown] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleMarkdownChange = (e) => {
        setMarkdown(e.target.value)
    };

    // Task save handler
    const handleSaveTask = async () => {
        try {
            setIsSaving(true)
            const response = await axios.patch(
                'http://localhost:3000/api/task/update/6a60d3769b32d22eee843906',
                { content: markdown })

            if (response.status === 200) {
                toast.success('Task updated')
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
                const response = await axios.get('http://localhost:3000/api/task/get/6a60d3769b32d22eee843906')
                setMarkdown(response.data.content);
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to load task.')
            }
        }
        fetchTask();
    }, [])

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-secondary">
                    Editing <span className="text-primary font-medium">Untitled task</span>
                </p>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="secondary"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSaveTask}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving…' : 'Save'}
                    </Button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">

                {/* Editor panel */}
                <div className="flex flex-col rounded-xl border border-divider bg-input overflow-hidden">
                    <p className="px-4 py-2 text-[11px] uppercase tracking-widest text-accent-color border-b border-divider">
                        Markdown
                    </p>
                    <textarea
                        value={markdown}
                        onChange={handleMarkdownChange}
                        placeholder="# Start writing..."
                        className="flex-1 resize-none bg-transparent p-4 text-sm font-mono text-primary placeholder-accent-color/70 outline-none focus:ring-2 focus:ring-inset focus:ring-brand/30"
                    />
                </div>

                {/* Preview panel */}
                <div className="flex flex-col rounded-xl border border-divider bg-main overflow-hidden">
                    <p className="px-4 py-2 text-[11px] uppercase tracking-widest text-accent-color border-b border-divider">
                        Preview
                    </p>

                    <div className="flex-1 overflow-y-auto p-4 text-sm text-primary
                        [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:mb-3 [&_h1]:mt-1
                        [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-4
                        [&_p]:text-secondary [&_p]:mb-3 [&_p]:leading-relaxed
                        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:text-secondary
                        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:text-secondary
                        [&_li]:mb-1
                        [&_a]:text-brand [&_a]:underline
                        [&_code]:font-mono [&_code]:text-[13px] [&_code]:bg-[#161616] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded
                        [&_pre]:bg-[#161616] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:mb-3 [&_pre]:overflow-x-auto
                        [&_blockquote]:border-l-2 [&_blockquote]:border-brand/50 [&_blockquote]:pl-3 [&_blockquote]:text-secondary [&_blockquote]:italic
                        [&_hr]:border-divider [&_hr]:my-4
                        [&_table]:w-full [&_table]:text-sm [&_table]:mb-3
                        [&_th]:border [&_th]:border-divider [&_th]:px-2 [&_th]:py-1 [&_th]:text-left
                        [&_td]:border [&_td]:border-divider [&_td]:px-2 [&_td]:py-1">
                        <Markdown
                            remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
                            rehypePlugins={[rehypeHighlight, rehypeSanitize]}>
                            {markdown}
                        </Markdown>
                    </div>
                </div>
            </div>
        </div>
    );
}