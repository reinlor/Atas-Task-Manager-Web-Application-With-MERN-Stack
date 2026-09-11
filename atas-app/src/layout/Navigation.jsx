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
        <nav className="fixed bottom-0 left-0 right-0 z-30 h-16 flex shrink-0 flex-row border-t border-divider bg-[#161616] lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:flex-col lg:border-r lg:border-t-0">
            <div className="hidden px-5 py-5 items-center gap-2 font-mono text-sm text-brand lg:flex">
                <span>&gt;_</span>
                <span className="text-primary font-medium tracking-tight">atas</span>
            </div>

            <ul className="flex flex-1 items-stretch justify-around px-1 lg:mt-2 lg:block lg:space-y-1 lg:px-3">
                {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
                    const isActive = location.pathname === path;
                    return (
                        <li key={path}>
                            <button
                                type="button"
                                onClick={() => navigate(path)}
                                aria-current={isActive ? "page" : undefined}
                                className={`w-full h-full flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg text-[10px] transition-colors cursor-pointer lg:h-auto lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-2.5 lg:text-sm ${
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

            <div className="hidden p-3 border-t border-divider lg:block">
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