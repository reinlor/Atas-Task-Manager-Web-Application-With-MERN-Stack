import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

export default function TaskModal({
    display,
    onClose,
    onDeleteRequest,
    isOwner,
    currentTeamId,
    onShare,
    onUnshare,
}) {
    const [showCollab, setShowCollab] = useState(false)
    const taskModalRef = useRef()

    useEffect(() => {
        const thisRef = taskModalRef.current;
        if (!thisRef) return
        if (display && !thisRef.open) thisRef.showModal();
        else if (!display && thisRef.open) thisRef.close();
    }, [display])

    const handleCancel = (e) => {
        e.preventDefault();
        onClose();
    };

    useEffect(() => {
        if (!display) setShowCollab(false);
    }, [display]);

    return (
        <dialog
            ref={taskModalRef}
            onCancel={handleCancel}
            className="m-auto w-[calc(100%-2rem)] max-w-sm max-h-[80vh] overflow-y-auto
                bg-input border border-divider rounded-2xl p-5 shadow-2xl shadow-black/40
                text-primary
                backdrop:bg-black/60 backdrop:backdrop-blur-[2px]"
        >
            {showCollab ? (
                <CollabList
                    currentTeamId={currentTeamId}
                    onShare={(teamId) => { onShare(teamId); onClose(); }}
                    onUnshare={() => { onUnshare(); onClose(); }}
                    onBack={() => setShowCollab(false)}
                />
            ) : (
                <div className="flex flex-col gap-1">
                    {isOwner && (
                        <>
                            <button
                                type="button"
                                onClick={() => setShowCollab(true)}
                                className="text-left px-2.5 py-2.5 rounded-lg text-sm text-primary hover:bg-main transition-colors cursor-pointer"
                            >
                                Share
                            </button>
                            <hr className="border-divider" />
                            <button
                                type="button"
                                onClick={() => { onClose(); onDeleteRequest(); }}
                                className="text-left px-2.5 py-2.5 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                            >
                                Delete
                            </button>
                            <hr className="border-divider" />
                        </>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-left px-2.5 py-2.5 rounded-lg text-sm text-secondary hover:bg-main transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            )}
        </dialog>
    )
}

function CollabList({ currentTeamId, onShare, onUnshare, onBack }) {
    const [teams, setTeams] = useState(null)

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL}/api/team/get`,
                    { withCredentials: true }
                )
                setTeams(response.data.teams ?? [])
            } catch (err) {
                toast.error(err.response?.data?.message || "Failed to load your teams.")
                setTeams([])
            }
        }
        fetchTeams()
    }, [])

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-primary">Share with a team</h2>
                <button
                    type="button"
                    onClick={onBack}
                    className="text-xs text-accent-color hover:text-primary transition-colors cursor-pointer"
                >
                    Back
                </button>
            </div>
            <hr className="border-divider mb-3" />

            {teams === null ? (
                <p className="text-secondary text-sm">Loading teams…</p>
            ) : teams.length === 0 ? (
                <p className="text-secondary text-sm">
                    You don't have any teams yet — create one from the Team page first.
                </p>
            ) : (
                <div className="space-y-1.5">
                    {teams.map((t) => (
                        <button
                            key={t._id}
                            type="button"
                            onClick={() => onShare(t._id)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer border ${
                                t._id === currentTeamId
                                    ? "bg-brand/10 text-brand border-brand/30"
                                    : "text-primary border-transparent hover:bg-main"
                            }`}
                        >
                            {t.name}
                            {t._id === currentTeamId && <span className="text-[11px]">Shared</span>}
                        </button>
                    ))}
                </div>
            )}

            {currentTeamId && (
                <button
                    type="button"
                    onClick={onUnshare}
                    className="w-full text-center mt-3 text-sm text-danger hover:brightness-110 transition cursor-pointer"
                >
                    Stop sharing
                </button>
            )}
        </div>
    )
}