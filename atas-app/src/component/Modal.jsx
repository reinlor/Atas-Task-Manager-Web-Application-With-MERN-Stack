import { useEffect, useRef } from "react";
import Button from "./Button"

export default function Modal({
    title,
    content,
    display,
    onConfirm,
    onCancel
}) {
    const dialogRef = useRef(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (display && !dialog.open) dialog.showModal();
        else if (!display && dialog.open) dialog.close();
    }, [display]);

    return (
        <dialog
            ref={dialogRef}

            onClick={(e) => {
                if (e.target === dialogRef.current && onCancel) onCancel();
            }}
            onCancel={(e) => {
                if (onCancel) onCancel();
                else e.preventDefault();
            }}
            className="m-auto w-[calc(100%-2rem)] max-w-md max-h-[80vh] overflow-y-auto
                bg-input border border-divider rounded-2xl p-6 shadow-2xl shadow-black/40
                text-primary
                backdrop:bg-black/60 backdrop:backdrop-blur-[2px]"
        >
            <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-semibold text-primary">{title}</h2>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        aria-label="Close"
                        className="text-accent-color hover:text-primary transition-colors cursor-pointer -mt-1 -mr-1 text-xl leading-none"
                    >
                        &times;
                    </button>
                )}
            </div>

            <p className="text-secondary text-sm mt-2">{content}</p>

            <div className="flex justify-end gap-2 mt-6">
                {/* Cancel Button */}
                {onCancel && (
                    <Button onClick={onCancel} variant="secondary">
                        Cancel
                    </Button>
                )}
                {/* Confirm Button */}
                <Button onClick={onConfirm}>
                    Confirm
                </Button>
            </div>
        </dialog>
    );
}