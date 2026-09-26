import { useNavigate } from "react-router-dom";
import { getTaskSnippet } from "../utils/taskText";
import { useAuth } from "../context/AuthContext";

const STATUS_STYLES = {
    "Pending": { dot: "bg-accent-color", text: "text-secondary" },
    "In Progress": { dot: "bg-brand", text: "text-brand" },
    "Complete": { dot: "bg-secondary", text: "text-secondary" },
};

export default function TaskCard({ task }) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const snippet = getTaskSnippet(task.content);

    const lastTouched = task.update || task.created;
    const dateLabel = lastTouched
        ? new Date(lastTouched).toLocaleDateString(undefined, { month: "short", day: "numeric" })
        : null;
    const status = STATUS_STYLES[task.status] ?? STATUS_STYLES.Pending;

    const isShared = Boolean(user && task.createdBy && task.createdBy !== user._id);
    return (
        <button
            type="button"
            onClick={() => navigate(`/task/${task._id}`)}
            className="relative text-left flex flex-col rounded-xl border border-divider bg-input p-4 h-40 hover:border-brand/50 hover:bg-[#232323] transition-colors cursor-pointer"
        >
            {isShared && (
                <span className="absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-brand/15 text-brand border border-brand/30">
                    Shared
                </span>
            )}

            <div className="flex items-start justify-between gap-2 pr-12">
                <h3 className="text-primary font-medium truncate">{task.title}</h3>
            </div>

            <p className="text-secondary text-sm mt-1.5 line-clamp-3 flex-1">
                {snippet || "No content yet."}
            </p>

            <div className="flex items-center justify-between mt-3">
                <span className={`inline-flex items-center gap-1.5 text-[11px] ${status.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {task.status}
                </span>
                {dateLabel && (
                    <span className="text-[11px] text-accent-color">
                        {task.update ? "Edited" : "Created"} {dateLabel}
                    </span>
                )}
            </div>
        </button>
    );
}