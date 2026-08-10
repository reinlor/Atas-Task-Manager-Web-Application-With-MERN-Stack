const VARIANTS = {
    primary: {
        idle: "bg-brand text-main hover:brightness-110 active:brightness-95",
        loading: "bg-brand/50 text-main",
    },
    secondary: {
        idle: "bg-transparent border border-divider text-primary hover:bg-input",
        loading: "bg-input text-secondary",
    },
};

export default function Button({
    children,
    onClick,
    isLoading,
    disabled,
    cstyle = "",
    type = "button",
    variant = "primary",
    ...props
}) {
    const styles = VARIANTS[variant] ?? VARIANTS.primary;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={isLoading || disabled}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold
                transition ease-in-out duration-150 cursor-pointer
                disabled:opacity-50 disabled:cursor-not-allowed
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-main
                ${isLoading ? styles.loading : styles.idle}
                ${cstyle}`}
            {...props}
        >
            {isLoading ? (
                <>  {/* Svg came from official tailwind hehe */}
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                </>
            ) : (
                children
            )}
        </button>
    );
}