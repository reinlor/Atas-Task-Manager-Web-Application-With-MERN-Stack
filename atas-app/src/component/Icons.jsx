const base = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
};

export function DashboardIcon(props) {
    return (
        <svg {...base} {...props}>
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
    );
}

export function TaskIcon(props) {
    return (
        <svg {...base} {...props}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M8 12l2.5 2.5L16 9" />
        </svg>
    );
}

export function ClockIcon(props) {
    return (
        <svg {...base} {...props}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3.5 2" />
        </svg>
    );
}

export function TeamIcon(props) {
    return (
        <svg {...base} {...props}>
            <circle cx="9" cy="8" r="3.25" />
            <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
            <path d="M16 4.3c1.7.5 3 2.1 3 4s-1.3 3.5-3 4" />
            <path d="M21.5 20c0-2.9-1.9-5.3-4.5-6.2" />
        </svg>
    );
}

export function LogoutIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M9 3H5.5A1.5 1.5 0 0 0 4 4.5v15A1.5 1.5 0 0 0 5.5 21H9" />
            <path d="M15 16l5-4-5-4" />
            <path d="M20 12H9" />
        </svg>
    );
}

export function BellIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M18 8a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
            <path d="M10.5 20a1.5 1.5 0 0 0 3 0" />
        </svg>
    );
}