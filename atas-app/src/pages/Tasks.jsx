import { useState, useEffect } from "react";
import Markdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import rehypeSanitize from 'rehype-sanitize';
import axios from "axios";

export default function Tasks() {
    const [markdown, setMarkdown] = useState("");

    const handleMarkdownChange = (e) => {
        setMarkdown(e.target.value)
    };

    const handleSaveTask = async () => {
        try {
            const response = await axios.patch(
                'http://localhost:3000/api/task/update/6a60d3769b32d22eee843906',
                { content: markdown })  
            
            if (response.status === 200){
                alert('updated succesfully')
            }
        } catch (err) {
            console.error('Update failed:', err.response?.data?.message || err.message);
        }
    }

    useEffect(() => {
        const fetchTask = async () => {
            try {
                const response = await axios.get('http://localhost:3000/api/task/get/6a60d3769b32d22eee843906')
                setMarkdown(response.data.content);
            } catch (err) {
                alert("Error", err.response?.data?.message || err.message);
            }
        }
        fetchTask();
    },[])

    return (
        <>
            This is a tasks
            <section className="relative">
                <div className="flex h-190 justify-center">
                    <div className="rounded-sm border mx-2 w-150">
                        <textarea
                            value={markdown}
                            className="focus:outline-none p-2 resize-none w-150 h-200"
                            onChange={handleMarkdownChange} />
                    </div>

                    <div className="rounded-sm border mx-2 w-150 p-2">
                        <Markdown
                            remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
                            rehypePlugins={[rehypeHighlight, rehypeSanitize]}>
                            {markdown}
                        </Markdown>
                    </div>
                </div>
                <div className="absolute grid grid-cols-2 gap-2 right-10">
                    <button className="cursor-pointer"
                        onClick={handleSaveTask}>Save</button>
                    <button className="cursor-pointer">Cancel</button>
                </div>
            </section>
        </>
    );
}
