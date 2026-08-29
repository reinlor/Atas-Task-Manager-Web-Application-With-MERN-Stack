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

export function ChevronDownIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M6 9l6 6 6-6" />
        </svg>
    );
}

export function SparkleIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />
            <circle cx="12" cy="12" r="2.5" />
        </svg>
    );
}
 
export function XIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M6 6l12 12M18 6L6 18" />
        </svg>
    );
}
 
export function SendIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M4 12l16-8-6 16-2.5-6.5L4 12z" />
        </svg>
    );
}

export function SearchIcon(props) {
    return (
        <svg {...base} {...props}>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
        </svg>
    );
}

export function TrashIcon(props) {
    return (
        <svg {...base} {...props}>
            <path d="M4 7h16" />
            <path d="M10 11v6M14 11v6" />
            <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
            <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" />
        </svg>
    );
}