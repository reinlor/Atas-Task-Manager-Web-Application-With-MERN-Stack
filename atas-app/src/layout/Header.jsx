import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "../component/NotificationBell";
import { useAuth } from "../context/AuthContext";
import { LogoutIcon } from "../component/Icons";
import axios from "axios";

const PAGE_TITLES = [
    { match: (path) => path === "/dashboard", title: "Dashboard" },
    { match: (path) => path.startsWith("/task"), title: "Tasks" },
    { match: (path) => path === "/log", title: "Log" },
    { match: (path) => path === "/team", title: "Team" },
];

function Header() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const profileRef = useRef(null);
    const title = PAGE_TITLES.find(({ match }) => match(location.pathname))?.title ?? "atas";

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const getInitials = (username = "") => {
        const words = username.trim().split(/\s+/).filter(Boolean);
        if (words.length > 1) return `${words[0][0]}${words[1][0]}`.toUpperCase();
        return username.replace(/\s/g, "").slice(0, 2).toUpperCase() || "?";
    };

    const handleLogout = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/account/logout`, {}, { withCredentials: true });
        } finally {
            navigate("/");
        }
    };
 
    return (
        <header className="flex items-center justify-between px-4 py-3 border-b border-divider bg-main sm:px-6 sm:py-4">
            <h1 className="text-lg font-semibold text-primary">{title}</h1>
 
            <div className="flex items-center gap-4">
                <NotificationBell currentUserId={user?._id} />

                <div className="relative" ref={profileRef}>
                    <button
                        type="button"
                        onClick={() => setIsProfileOpen((open) => !open)}
                        aria-label="Open profile menu"
                        aria-expanded={isProfileOpen}
                        className="w-8 h-8 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center text-xs font-medium text-brand hover:bg-brand/30 transition-colors cursor-pointer"
                    >
                        {getInitials(user?.username)}
                    </button>
                    {isProfileOpen && (
                        <div className="absolute right-0 top-full mt-2 w-36 rounded-lg border border-divider bg-input p-1 shadow-xl z-50">
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-secondary hover:bg-main hover:text-primary transition-colors cursor-pointer"
                            >
                                <LogoutIcon className="w-4 h-4" />
                                Log out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Header;