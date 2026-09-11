import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { TaskIcon, HistoryIcon } from "../component/Icons";
import { useState } from 'react'

// Temp Data
// TODO: Change date into real data retrieved from database
const MOCK_STATS = [
    { label: "Total tasks", value: 12 },
    { label: "Pending & In progress", value: 4 },
    { label: "Completed", value: 6 },
    { label: "Shared with you", value: 3 },
];

const STATUS_STYLES = {
    "Pending": { dot: "bg-accent-color", text: "text-secondary" },
    "In Progress": { dot: "bg-brand", text: "text-brand" },
    "Complete": { dot: "bg-secondary", text: "text-secondary" },
};

const MOCK_RECENT_TASKS = [
    { id: "1", title: "Sprint planning", status: "In Progress", time: "2h ago" },
    { id: "2", title: "Q3 roadmap", status: "Pending", time: "Yesterday" },
    { id: "3", title: "Fix login bug", status: "Complete", time: "Yesterday" },
    { id: "4", title: "Client onboarding", status: "Pending", time: "2 days ago" },
];

const MOCK_ACTIVITY = [
    { id: "1", text: "You created \"Sprint planning\"", time: "2h ago" },
    { id: "2", text: "You shared \"Sprint planning\" with Marketing Team", time: "2h ago" },
    { id: "3", text: "Jordan updated \"Q3 Roadmap\"", time: "5h ago" },
    { id: "4", text: "Alex changed your role to Editor", time: "Yesterday" },
];

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
}

function Dashboard() {
    const { user } = useAuth();

    return (
        <div className="w-full">
            <p className="text-secondary text-xs sm:text-sm">
                {getGreeting()}{user?.username ? `, ${user.username}` : ""}.
            </p>
            <h1 className="text-base font-semibold text-primary mt-1 mb-5 sm:text-xl lg:mb-8 lg:text-2xl">
                Here's what's happening across your boards.
            </h1>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2.5 mb-6 sm:gap-4 sm:mb-8 lg:gap-5">
                {MOCK_STATS.map((stat) => (
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
                        {MOCK_RECENT_TASKS.map((task) => {
                            const style = STATUS_STYLES[task.status] ?? STATUS_STYLES.Pending;
                            return (
                                <div
                                    key={task.id}
                                    className="flex items-center justify-between rounded-lg border border-divider bg-input px-3 py-2.5 sm:px-4 sm:py-3 lg:px-5 lg:py-3.5"
                                >
                                    <div className="flex items-center gap-2 min-w-0 sm:gap-2.5">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                                        <p className="text-xs text-primary truncate sm:text-sm">{task.title}</p>
                                    </div>
                                    <p className="text-[11px] text-accent-color shrink-0 ml-2 sm:ml-3 sm:text-xs">{task.time}</p>
                                </div>
                            );
                        })}
                        {MOCK_RECENT_TASKS.length === 0 && (
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
                        {MOCK_ACTIVITY.map((item) => (
                            <div key={item.id}>
                                <p className="text-xs text-primary leading-snug sm:text-sm">{item.text}</p>
                                <p className="text-[11px] text-accent-color mt-0.5 sm:text-xs">{item.time}</p>
                            </div>
                        ))}
                        {MOCK_ACTIVITY.length === 0 && (
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