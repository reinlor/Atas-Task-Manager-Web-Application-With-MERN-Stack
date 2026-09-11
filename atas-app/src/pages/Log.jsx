import { HistoryIcon, TaskIcon, TeamIcon } from "../component/Icons";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const TYPE_ICON = {
    task_created: TaskIcon,
    task_updated: TaskIcon,
    task_completed: TaskIcon,
    task_deleted: TaskIcon,
    task_shared: TeamIcon,
    task_unshared: TeamIcon,
    role_changed: TeamIcon,
    member_added: TeamIcon,
    team_created: TeamIcon,
};

function formatDateLabel(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (a, b) =>
        a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    if (isSameDay(date, today)) return "Today";
    if (isSameDay(date, yesterday)) return "Yesterday";
    return date.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function groupByDay(entries) {
    const groups = [];
    for (const entry of entries) {
        const label = formatDateLabel(entry.createdAt);
        const existing = groups.find((g) => g.label === label);
        if (existing) existing.items.push(entry);
        else groups.push({ label, items: [entry] });
    }
    return groups;
}

export default function Log() {
    const { user } = useAuth();
    const [entries, setEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL}/api/activity`,
                    { withCredentials: true }
                );
                setEntries(response.data.activities ?? []);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load activity.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchActivities();
    }, []);

    const sorted = [...entries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const groups = groupByDay(sorted);

    if (isLoading) return <p className="text-secondary text-sm">Loading activity…</p>;
    if (error) return <p className="text-danger text-sm">{error}</p>;

    if (sorted.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-24 max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-full bg-input border border-divider flex items-center justify-center mb-4">
                    <HistoryIcon className="w-5 h-5 text-accent-color" />
                </div>
                <h2 className="text-primary font-medium">No activity yet</h2>
                <p className="text-secondary text-sm mt-1">
                    Changes across your tasks and teams will show up here.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl">
            <h1 className="text-xl font-semibold text-primary mb-1">Activity log</h1>
            <p className="text-secondary text-sm mb-8">A running history of what's changed across your tasks and teams.</p>

            <div className="space-y-8">
                {groups.map((group) => (
                    <div key={group.label}>
                        <p className="text-xs font-medium uppercase tracking-widest text-accent-color mb-3">
                            {group.label}
                        </p>

                        <div className="relative pl-5 border-l border-divider space-y-5 sm:pl-6">
                            {group.items.map((entry) => {
                                const Icon = TYPE_ICON[entry.type] ?? HistoryIcon;
                                const isActor = entry.actorId === user?._id || entry.actorId?._id === user?._id;
                                const actorName = entry.actorId?.username || "Someone";
                                const text = isActor
                                    ? `You ${entry.text}`
                                    : `${actorName} ${entry.text}`;
                                return (
                                    <div key={entry._id} className="relative">
                                        <span className="absolute -left-6.25 top-0.5 w-4 h-4 rounded-full bg-input border-2 border-brand flex items-center justify-center sm:-left-7.25">
                                            <Icon className="w-2 h-2 text-brand" strokeWidth={2.5} />
                                        </span>
                                        <p className="text-sm text-primary">{text}</p>
                                        <p className="text-xs text-accent-color mt-0.5">{formatTime(entry.createdAt)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}