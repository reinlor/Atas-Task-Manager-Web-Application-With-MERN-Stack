import { cn } from "@/lib/utils"

function Test({ isActive, className }) {
    return (
        <span
            className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium",
                isActive ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-muted text-muted-foreground",
                className // Allows overriding or passing extra utilities from parents
            )}
        >
            {isActive ? "Active" : "Pending"}
        </span>
    );
};

export default Test