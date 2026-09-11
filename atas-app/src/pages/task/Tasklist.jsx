import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import TaskCard from "../../component/Taskcard"
import { TaskIcon } from "../../component/Icons";

export default function TaskList() {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState("all");
    const [sort, setSort] = useState("latest");
    const [scope, setScope] = useState("all");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL}/api/task/get`,
                    {
                        withCredentials: true,
                        params: { status, sort, scope }
                    }
                );
                setTasks(response.data.tasks ?? response.data);
            } catch (err) {
                if(err.status !== 404) 
                    toast.error(err.response?.data?.message || "Failed to load tasks.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchTasks();
    }, [scope, sort, status]);

    const handleCreateTask = async () => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/task/create`,
                { title: "Untitled task", status: "Pending", content: "" },
                { withCredentials: true }
            );
            navigate(`/task/${response.data._id}?new=true`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Could not create task.");
        }
    };

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <p className="text-sm text-secondary">
                    {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                </p>
                <button
                    type="button"
                    onClick={handleCreateTask}
                    className="inline-flex items-center gap-2 bg-brand text-main text-sm font-semibold rounded-lg px-3 py-2.5 hover:brightness-110 active:brightness-95 transition cursor-pointer sm:px-4"
                >
                    + New task
                </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    aria-label="Filter tasks by status"
                    className="bg-input border border-divider rounded-lg px-3 py-2 text-sm text-primary outline-none focus:border-brand"
                >
                    <option value="all">All status</option>
                    <option value="pending">Pending</option>
                    <option value="in progress">In progress</option>
                    <option value="complete">Completed</option>
                </select>
                <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    aria-label="Sort tasks"
                    className="bg-input border border-divider rounded-lg px-3 py-2 text-sm text-primary outline-none focus:border-brand"
                >
                    <option value="latest">Latest</option>
                    <option value="oldest">Oldest</option>
                </select>
                <select
                    value={scope}
                    onChange={(event) => setScope(event.target.value)}
                    aria-label="Filter task scope"
                    className="bg-input border border-divider rounded-lg px-3 py-2 text-sm text-primary outline-none focus:border-brand"
                >
                    <option value="all">All tasks</option>
                    <option value="local">Local tasks</option>
                    <option value="shared">Shared tasks</option>
                </select>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-40 rounded-xl border border-divider bg-input animate-pulse" />
                    ))}
                </div>
            ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-24 max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-full bg-input border border-divider flex items-center justify-center mb-4">
                        <TaskIcon className="w-5 h-5 text-accent-color" />
                    </div>
                    <h2 className="text-primary font-medium">No tasks yet</h2>
                    <p className="text-secondary text-sm mt-1 mb-5">
                        Create your first task and start writing in markdown.
                    </p>
                    <button
                        type="button"
                        onClick={handleCreateTask}
                        className="inline-flex items-center gap-2 bg-brand text-main text-sm font-semibold rounded-lg px-4 py-2.5 hover:brightness-110 transition cursor-pointer"
                    >
                        + New task
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tasks.map((task) => (
                        <TaskCard key={task._id} task={task} />
                    ))}
                </div>
            )}
        </div>
    );
}