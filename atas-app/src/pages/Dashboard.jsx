import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
    ArrowRight,
    CheckCheck,
    Clock3,
    FileText,
    History,
    TriangleAlert,
    UsersRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/ui/badge";
import { buttonVariants } from "../components/ui/button";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";

const STATUS_STYLES = {
    Pending: "border-border bg-muted text-muted-foreground",
    "In Progress": "border-brand/20 bg-brand/10 text-brand",
    Complete: "border-success/20 bg-success/10 text-success",
};

const STATS = [
    { label: "Total tasks", key: "totalTask", icon: FileText },
    { label: "In progress", key: "inProgress", icon: Clock3 },
    { label: "Completed", key: "completed", icon: CheckCheck },
    { label: "Shared with you", key: "shared", icon: UsersRound },
];

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
}

function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function DashboardStat({ icon: Icon, label, value, isLoading }) {
    return (
        <Card size="sm" className="border-border bg-card shadow-none">
            <CardHeader className="grid-cols-[1fr_auto] items-center gap-3">
                <CardTitle className="text-sm font-normal text-muted-foreground">
                    {label}
                </CardTitle>
                <CardAction>
                    <span className="flex size-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                        <Icon aria-hidden="true" className="size-4" />
                    </span>
                </CardAction>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                ) : (
                    <p className="text-2xl font-semibold tracking-tight text-foreground">
                        {value}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function SectionHeading({ title, description, to, linkLabel }) {
    return (
        <CardHeader className="grid-cols-[1fr_auto] gap-3">
            <div className="space-y-1">
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </div>
            <CardAction>
                <Link
                    to={to}
                    className={buttonVariants({
                        variant: "ghost",
                        size: "sm",
                        className: "text-brand hover:text-brand",
                    })}
                >
                    {linkLabel}
                    <ArrowRight aria-hidden="true" />
                </Link>
            </CardAction>
        </CardHeader>
    );
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
        <div className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8">
            <Card className="relative overflow-hidden border-border bg-gradient-to-br from-brand/10 via-card to-card shadow-none">
                <CardContent className="flex flex-col gap-7 p-5 sm:p-8 lg:flex-row lg:items-end lg:justify-between lg:p-9">
                    <div className="max-w-2xl">
                        <Badge
                            variant="outline"
                            className="mb-4 border-brand/20 bg-brand/10 text-brand"
                        >
                            Your workspace
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                            {getGreeting()}{user?.username ? `, ${user.username}` : ""}
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                            Make space for focused work.
                        </h2>
                        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                            Keep your tasks moving and stay in sync with everything
                            happening across your workspace.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            to="/task"
                            className={buttonVariants({
                                size: "lg",
                                className: "!bg-brand !text-main hover:!bg-brand/90",
                            })}
                        >
                            <FileText aria-hidden="true" />
                            Open tasks
                        </Link>
                        <Link
                            to="/kanban"
                            className={buttonVariants({
                                variant: "outline",
                                size: "lg",
                            })}
                        >
                            View board
                            <ArrowRight aria-hidden="true" />
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <div
                    role="alert"
                    className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                    <TriangleAlert aria-hidden="true" className="size-4 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <section aria-label="Task overview" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                {STATS.map(({ icon, key, label }) => (
                    <DashboardStat
                        key={key}
                        icon={icon}
                        label={label}
                        value={stats[key] ?? 0}
                        isLoading={isLoading}
                    />
                ))}
            </section>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.35fr_0.9fr] lg:gap-6">
                <Card className="border-border bg-card shadow-none">
                    <SectionHeading
                        title="Recent tasks"
                        description="Your latest work, all in one place."
                        to="/task"
                        linkLabel="View all"
                    />
                    <CardContent className="min-h-64 pb-5">
                        {isLoading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between gap-4 rounded-lg border border-border/70 px-4 py-3"
                                    >
                                        <Skeleton className="h-4 w-2/3" />
                                        <Skeleton className="h-4 w-20 shrink-0" />
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <p className="py-12 text-center text-sm text-muted-foreground">
                                Tasks are unavailable until the dashboard can be loaded.
                            </p>
                        ) : recentTasks.length > 0 ? (
                            <div className="divide-y divide-border/70">
                                {recentTasks.map((task) => (
                                    <Link
                                        key={task._id}
                                        to={`/task/${task._id}`}
                                        className="flex items-center justify-between gap-4 rounded-md px-2 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span
                                                aria-hidden="true"
                                                className={`size-2 shrink-0 rounded-full ${
                                                    task.status === "Complete"
                                                        ? "bg-success"
                                                        : task.status === "In Progress"
                                                            ? "bg-brand"
                                                            : "bg-muted-foreground"
                                                }`}
                                            />
                                            <span className="truncate text-sm font-medium text-foreground">
                                                {task.title}
                                            </span>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-3">
                                            <Badge
                                                variant="outline"
                                                className={
                                                    STATUS_STYLES[task.status] ??
                                                    STATUS_STYLES.Pending
                                                }
                                            >
                                                {task.status || "Pending"}
                                            </Badge>
                                            <span className="hidden text-xs text-muted-foreground sm:block">
                                                {formatDate(task.created)}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="flex min-h-52 flex-col items-center justify-center px-4 text-center">
                                <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                    <FileText aria-hidden="true" className="size-5" />
                                </span>
                                <p className="font-medium text-foreground">No tasks yet</p>
                                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                                    Create a task to get your workspace moving.
                                </p>
                                <Link
                                    to="/task"
                                    className={buttonVariants({
                                        variant: "link",
                                        className: "mt-2 text-brand",
                                    })}
                                >
                                    Go to tasks
                                    <ArrowRight aria-hidden="true" />
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border bg-card shadow-none">
                    <SectionHeading
                        title="Recent activity"
                        description="The latest updates from your workspace."
                        to="/log"
                        linkLabel="View log"
                    />
                    <CardContent className="min-h-64 pb-5">
                        {isLoading ? (
                            <div className="space-y-5">
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <div key={index} className="space-y-2">
                                        <Skeleton className="h-4 w-4/5" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <p className="py-12 text-center text-sm text-muted-foreground">
                                Activity is unavailable until the dashboard can be loaded.
                            </p>
                        ) : recentActivity.length > 0 ? (
                            <div className="space-y-5">
                                {recentActivity.map((item) => (
                                    <div key={item._id} className="flex gap-3">
                                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                            <History aria-hidden="true" className="size-4" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="text-sm leading-relaxed text-foreground">
                                                {getActivityText(item)}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {formatDate(item.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex min-h-52 flex-col items-center justify-center px-4 text-center">
                                <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                    <History aria-hidden="true" className="size-5" />
                                </span>
                                <p className="font-medium text-foreground">Nothing to show yet</p>
                                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                                    Updates will appear here as you work.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default Dashboard;
