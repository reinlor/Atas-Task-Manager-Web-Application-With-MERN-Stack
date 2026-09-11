import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { TaskIcon, HistoryIcon } from "../component/Icons";
import { useEffect, useState } from "react";
import axios from "axios";

const STATUS_STYLES = {
    "Pending": { dot: "bg-accent-color", text: "text-secondary" },
    "In Progress": { dot: "bg-brand", text: "text-brand" },
    "Complete": { dot: "bg-secondary", text: "text-secondary" },
};

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
}

function Dashboard() {
    const { user } = useAuth();
    const [dashboard, setDashboard] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL}/api/dashboard/get`,
                    { withCredentials: true }
                );
                setDashboard(response.data.dashboardData);
                setTasks(response.data.taskData ?? []);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load dashboard.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const stats = dashboard?.stats ?? {};
    const recentTasks = tasks.slice(0, 5);
    const recentActivity = dashboard?.recentActivity ?? [];

    const getActivityText = (item) => {
        const actorId = item.actorId?._id || item.actorId;
        const actorName = item.actorId?.username || "Someone";
        return actorId === user?._id ? `You ${item.text}` : `${actorName} ${item.text}`;
    };

    return (
        <div className="w-full">
            <p className="text-secondary text-xs sm:text-sm">
                {getGreeting()}{user?.username ? `, ${user.username}` : ""}.
            </p>
            <h1 className="text-base font-semibold text-primary mt-1 mb-5 sm:text-xl lg:mb-8 lg:text-2xl">
                Here's what's happening across your boards.
            </h1>

            {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2.5 mb-6 sm:gap-4 sm:mb-8 lg:gap-5">
                {[
                    { label: "Total tasks", value: stats.totalTask ?? 0 },
                    { label: "Pending & In progress", value: stats.inProgress ?? 0 },
                    { label: "Completed", value: stats.completed ?? 0 },
                    { label: "Shared with you", value: stats.shared ?? 0 },
                ].map((stat) => (
                    <div key={stat.label} className="rounded-lg border border-divider bg-input p-3 sm:rounded-xl sm:p-4 lg:p-5">
                        <p className="text-xl font-semibold text-primary sm:text-2xl lg:text-3xl">{stat.value}</p>
                        <p className="text-[10px] text-accent-color uppercase tracking-wide mt-1 sm:text-xs">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-3 lg:gap-8">
                {/* Recent tasks */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                        <h2 className="text-xs font-semibold text-primary sm:text-sm lg:text-base">Recent tasks</h2>
                        <Link to="/task" className="text-[11px] text-brand hover:brightness-110 transition sm:text-xs">
                            View all →
                        </Link>
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                        {isLoading && <p className="text-sm text-secondary py-4">Loading tasks...</p>}
                        {!isLoading && recentTasks.map((task) => {
                            const style = STATUS_STYLES[task.status] ?? STATUS_STYLES.Pending;
                            return (
                                <div
                                    key={task._id}
                                    className="flex items-center justify-between rounded-lg border border-divider bg-input px-3 py-2.5 sm:px-4 sm:py-3 lg:px-5 lg:py-3.5"
                                >
                                    <div className="flex items-center gap-2 min-w-0 sm:gap-2.5">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                                        <p className="text-xs text-primary truncate sm:text-sm">{task.title}</p>
                                    </div>
                                    <p className="text-[11px] text-accent-color shrink-0 ml-2 sm:ml-3 sm:text-xs">
                                        {new Date(task.created).toLocaleDateString()}
                                    </p>
                                </div>
                            );
                        })}
                        {!isLoading && recentTasks.length === 0 && (
                            <div className="flex flex-col items-center justify-center text-center py-10">
                                <TaskIcon className="w-5 h-5 text-accent-color mb-2" />
                                <p className="text-secondary text-sm">No tasks yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent activity */}
                <div>
                    <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                        <h2 className="text-xs font-semibold text-primary sm:text-sm lg:text-base">Recent activity</h2>
                        <Link to="/log" className="text-[11px] text-brand hover:brightness-110 transition sm:text-xs">
                            View log →
                        </Link>
                    </div>
                    <div className="rounded-lg border border-divider bg-input p-3 space-y-3 sm:p-4 sm:space-y-4 lg:p-5">
                        {isLoading && <p className="text-sm text-secondary">Loading activity...</p>}
                        {!isLoading && recentActivity.map((item) => (
                            <div key={item._id}>
                                <p className="text-xs text-primary leading-snug sm:text-sm">{getActivityText(item)}</p>
                                <p className="text-[11px] text-accent-color mt-0.5 sm:text-xs">
                                    {new Date(item.timestamp).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                        {!isLoading && recentActivity.length === 0 && (
                            <div className="flex flex-col items-center justify-center text-center py-6">
                                <HistoryIcon className="w-5 h-5 text-accent-color mb-2" />
                                <p className="text-secondary text-sm">Nothing yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;