import { useState, useRef, useEffect } from "react";
import { BellIcon, TaskIcon, TeamIcon } from "./Icons";
import { io } from 'socket.io-client';
import axios from 'axios'

const TYPE_ICON = { share: TeamIcon, role: TeamIcon, invite: TeamIcon, update: TaskIcon };

export default function NotificationBell({ currentUserId }) {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const containerRef = useRef(null);

    // Initial Fetch & Socket Connection
    useEffect(() => {
        if (!currentUserId) return;

        const fetchNotifications = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL}/api/notification`,
                    { withCredentials: true }
                );
                setNotifications(response.data.notifications ?? response.data ?? []);
            } catch (err) {
                if (err.response?.status !== 404) {
                    toast.error(err.response?.data?.message || "Failed to load notifications.");
                }
            }
        };

        fetchNotifications();

        // Sockt setup
        const socket = io(import.meta.env.VITE_API_BASE_URL, { withCredentials: true });

        socket.on("connect", () => {
            socket.emit("join_bell", currentUserId);
        });

        socket.on("new_notification", (newNotif) => {
            setNotifications((prev) => [newNotif, ...prev]);
        });

        return () => socket.disconnect();
    }, [currentUserId]);

    // Close popover on outside click
    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const markAllRead = async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/notification/read-all`, {
            method: 'PATCH',
            credentials: 'include'
        });
    };

    const markRead = async (id) => {
        setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
        await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/notification/${id}/read`, {
            method: 'PATCH',
            credentials: 'include'
        });
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label="Notifications"
                className="relative text-secondary hover:text-primary transition-colors cursor-pointer"
            >
                <BellIcon className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-danger text-primary text-[10px] font-medium flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            <div
                className={`absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-3rem)] origin-top-right
                    bg-input border border-divider rounded-2xl shadow-2xl shadow-black/40
                    flex flex-col overflow-hidden transition-all duration-150 z-50
                    ${open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}`}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-divider">
                    <p className="text-sm font-medium text-primary">Notifications</p>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={markAllRead}
                            className="text-xs text-brand hover:brightness-110 transition cursor-pointer"
                        >
                            Mark all read
                        </button>
                    )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <p className="text-secondary text-sm text-center py-6">You're all caught up.</p>
                    ) : (
                        notifications.map((n) => {
                            const Icon = TYPE_ICON[n.type] ?? BellIcon;
                            return (
                                <button
                                    key={n._id}
                                    type="button"
                                    onClick={() => markRead(n._id)}
                                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors cursor-pointer hover:bg-main ${!n.read ? "bg-brand/5" : ""}`}
                                >
                                    <span className="w-7 h-7 rounded-full bg-brand/15 border border-brand/30 flex items-center justify-center shrink-0 mt-0.5">
                                        <Icon className="w-3.5 h-3.5 text-brand" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm text-primary leading-snug">{n.text}</span>
                                        <span className="block text-xs text-accent-color mt-0.5">
                                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </span>
                                    {!n.read && <span className="w-2 h-2 rounded-full bg-brand shrink-0 mt-1.5" />}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}