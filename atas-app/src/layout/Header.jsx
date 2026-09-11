import { useLocation } from "react-router-dom";
import NotificationBell from "../component/NotificationBell";
import { useAuth } from "../context/AuthContext";

const PAGE_TITLES = [
    { match: (path) => path === "/dashboard", title: "Dashboard" },
    { match: (path) => path.startsWith("/task"), title: "Tasks" },
    { match: (path) => path === "/log", title: "Log" },
    { match: (path) => path === "/team", title: "Team" },
];

function Header() {
    const location = useLocation();
    const { user } = useAuth();
    const title = PAGE_TITLES.find(({ match }) => match(location.pathname))?.title ?? "atas";
 
    return (
        <header className="flex items-center justify-between px-4 py-3 border-b border-divider bg-main sm:px-6 sm:py-4">
            <h1 className="text-lg font-semibold text-primary">{title}</h1>
 
            <div className="flex items-center gap-4">
                <NotificationBell currentUserId={user?._id} />

                <div className="w-8 h-8 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center text-xs font-medium text-brand">
                    RL
                </div>
            </div>
        </header>
    );
}

export default Header;