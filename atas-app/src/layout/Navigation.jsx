import { useNavigate, useLocation } from "react-router-dom";
import { DashboardIcon, TaskIcon, ClockIcon, TeamIcon, LogoutIcon } from "../component/Icons";

// Navigation Item
const NAV_ITEMS = [
    { label: "Dashboard", path: "/dashboard", icon: DashboardIcon },
    { label: "Tasks", path: "/task", icon: TaskIcon },
    { label: "Log", path: "/log", icon: ClockIcon },
    { label: "Team", path: "/team", icon: TeamIcon },
];

function Navigation() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <nav className="w-60 shrink-0 h-screen sticky top-0 flex flex-col bg-[#161616] border-r border-divider">
            <div className="px-5 py-5 flex items-center gap-2 font-mono text-sm text-brand">
                <span>&gt;_</span>
                <span className="text-primary font-medium tracking-tight">atas</span>
            </div>

            <ul className="flex-1 px-3 mt-2 space-y-1">
                {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
                    const isActive = location.pathname === path;
                    return (
                        <li key={path}>
                            <button
                                type="button"
                                onClick={() => navigate(path)}
                                aria-current={isActive ? "page" : undefined}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                                    isActive
                                        ? "bg-brand/10 text-brand font-medium"
                                        : "text-secondary hover:bg-input hover:text-primary"
                                }`}
                            >
                                <Icon className="w-4.5 h-4.5 shrink-0" />
                                {label}
                            </button>
                        </li>
                    );
                })}
            </ul>

            <div className="p-3 border-t border-divider">
                <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-secondary hover:bg-input hover:text-primary transition-colors cursor-pointer"
                >
                    <LogoutIcon className="w-4.5 h-4.5" />
                    Log out
                </button>
            </div>
        </nav>
    );
}

export default Navigation;