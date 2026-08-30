import { HistoryIcon, TaskIcon, TeamIcon } from "../component/Icons";

// Temp Data
// TODO: Change into real data retrived from database
const MOCK_LOG_ENTRIES = [
    { id: "1", type: "task_created", text: 'You created "Sprint planning"', date: "2026-08-30T09:14:00" },
    { id: "2", type: "task_shared", text: 'You shared "Sprint planning" with Marketing Team', date: "2026-08-30T09:16:00" },
    { id: "3", type: "task_updated", text: 'Jordan updated "Q3 Roadmap"', date: "2026-08-30T11:02:00" },
    { id: "4", type: "role_changed", text: "Alex changed your role to Editor on Marketing Team", date: "2026-08-29T15:40:00" },
    { id: "5", type: "task_completed", text: 'You marked "Fix login bug" as Complete', date: "2026-08-29T10:05:00" },
    { id: "6", type: "member_added", text: "You added Jordan to Marketing Team", date: "2026-08-28T17:22:00" },
    { id: "7", type: "task_created", text: 'You created "Client onboarding"', date: "2026-08-28T08:50:00" },
    { id: "8", type: "team_created", text: 'You created the team "Marketing Team"', date: "2026-08-27T13:10:00" },
];

const TYPE_ICON = {
    task_created: TaskIcon,
    task_updated: TaskIcon,
    task_completed: TaskIcon,
    task_shared: TeamIcon,
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
        const label = formatDateLabel(entry.date);
        const existing = groups.find((g) => g.label === label);
        if (existing) existing.items.push(entry);
        else groups.push({ label, items: [entry] });
    }
    return groups;
}

export default function Log() {
    const sorted = [...MOCK_LOG_ENTRIES].sort((a, b) => new Date(b.date) - new Date(a.date));
    const groups = groupByDay(sorted);

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
        <div className="max-w-2xl">
            <h1 className="text-xl font-semibold text-primary mb-1">Activity log</h1>
            <p className="text-secondary text-sm mb-8">A running history of what's changed across your tasks and teams.</p>

            <div className="space-y-8">
                {groups.map((group) => (
                    <div key={group.label}>
                        <p className="text-xs font-medium uppercase tracking-widest text-accent-color mb-3">
                            {group.label}
                        </p>

                        <div className="relative pl-6 border-l border-divider space-y-5">
                            {group.items.map((entry) => {
                                const Icon = TYPE_ICON[entry.type] ?? HistoryIcon;
                                return (
                                    <div key={entry.id} className="relative">
                                        <span className="absolute -left-7.25 top-0.5 w-4 h-4 rounded-full bg-input border-2 border-brand flex items-center justify-center">
                                            <Icon className="w-2 h-2 text-brand" strokeWidth={2.5} />
                                        </span>
                                        <p className="text-sm text-primary">{entry.text}</p>
                                        <p className="text-xs text-accent-color mt-0.5">{formatTime(entry.date)}</p>
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