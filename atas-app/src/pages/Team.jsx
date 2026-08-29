import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { TeamIcon, SearchIcon, XIcon, ChevronDownIcon, TrashIcon } from "../component/Icons";
import { useDebouncedValue } from "../hooks/UseDebouncerValue";
import { useAuth } from "../context/AuthContext";
import Modal from "../component/Modal";

function getInitials(name = "") {
    return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
}

function MemberRow({ user, role, isRowOwner, viewerIsOwner, pending, onRoleChange, onRemove }) {
    return (
        <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${pending ? "bg-brand/5 border border-dashed border-brand/40" : "bg-input border border-divider"}`}>
            <div className="w-8 h-8 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center text-xs font-medium text-brand shrink-0">
                {getInitials(user.username)}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-primary text-sm font-medium truncate">{user.username}</p>
                <p className="text-secondary text-xs truncate">{user.email}</p>
            </div>

            {isRowOwner ? (
                <span className="text-[11px] text-accent-color shrink-0">Owner</span>
            ) : viewerIsOwner ? (
                <div className="relative shrink-0">
                    <select
                        value={role}
                        onChange={(e) => onRoleChange(e.target.value)}
                        className="appearance-none bg-main border border-divider rounded-lg pl-2.5 pr-7 py-1 text-xs text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 cursor-pointer"
                    >
                        <option value="Editor">Editor</option>
                        <option value="Viewer">Viewer</option>
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-accent-color" />
                </div>
            ) : (
                <span className="text-[11px] text-secondary shrink-0">{role}</span>
            )}

            {viewerIsOwner && !isRowOwner && (
                <button
                    type="button"
                    onClick={onRemove}
                    aria-label={`Remove ${user.username}`}
                    className="text-accent-color hover:text-danger transition-colors cursor-pointer shrink-0"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

// Debounced search for add/inviting members hehe
function MemberSearch({ excludeIds, onPick }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const debouncedQuery = useDebouncedValue(query, 350);

    useEffect(() => {
        const trimmed = debouncedQuery.trim();
        if (!trimmed) {
            setResults([]);
            return;
        }
        const controller = new AbortController();
        const search = async () => {
            try {
                setIsSearching(true);
                const response = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL}/api/account/get/${encodeURIComponent(trimmed)}`,
                    { withCredentials: true, signal: controller.signal }
                );
                setResults(response.data.users ?? []);
            } catch (err) {
                if (!axios.isCancel(err)) toast.error(err.response?.data?.message || "Search failed.");
            } finally {
                setIsSearching(false);
            }
        };
        search();
        return () => controller.abort();
    }, [debouncedQuery]);

    const visibleResults = results.filter((u) => !excludeIds.includes(u._id));

    return (
        <div className="relative">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-color" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by username or email"
                    className="w-full bg-input border border-divider rounded-lg pl-9 pr-3 py-2.5 text-sm text-primary placeholder-accent-color/70 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors"
                />
            </div>

            {query.trim() && (
                <div className="absolute z-10 mt-1.5 w-full bg-input border border-divider rounded-lg shadow-xl shadow-black/30 max-h-60 overflow-y-auto">
                    {isSearching ? (
                        <p className="text-secondary text-sm px-3 py-3">Searching…</p>
                    ) : visibleResults.length === 0 ? (
                        <p className="text-secondary text-sm px-3 py-3">No matching users.</p>
                    ) : (
                        visibleResults.map((user) => (
                            <button
                                key={user._id}
                                type="button"
                                onClick={() => onPick(user)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-main transition-colors cursor-pointer"
                            >
                                <div className="w-7 h-7 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center text-[11px] font-medium text-brand shrink-0">
                                    {getInitials(user.username)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-primary text-sm truncate">{user.username}</p>
                                    <p className="text-accent-color text-xs truncate">{user.email}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

function CreateTeamForm({ onCreated, onCancel }) {
    const [name, setName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        try {
            setIsCreating(true);
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/team/create`,
                { name: name.trim() },
                { withCredentials: true }
            );
            onCreated(response.data.team);
        } catch (err) {
            toast.error(err.response?.data?.message || "Could not create team.");
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <form onSubmit={handleCreate} className="flex gap-2 w-full max-w-xs">
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Team name"
                maxLength={80}
                autoFocus
                className="flex-1 bg-input border border-divider rounded-lg px-3 py-2 text-sm text-primary placeholder-accent-color/70 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
            <button
                type="submit"
                disabled={!name.trim() || isCreating}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand text-main hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
            >
                {isCreating ? "Creating…" : "Create"}
            </button>
            {onCancel && (
                <button
                    type="button"
                    onClick={onCancel}
                    aria-label="Cancel"
                    className="text-accent-color hover:text-primary transition-colors cursor-pointer shrink-0 px-1"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            )}
        </form>
    );
}

export default function Team() {
    const { user } = useAuth();
    const [teams, setTeams] = useState(null); // null = loading
    const [activeTeamId, setActiveTeamId] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [stagedMembers, setStagedMembers] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [teamPendingDelete, setTeamPendingDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL}/api/team/get`,
                    { withCredentials: true }
                );
                const list = response.data.teams ?? [];
                setTeams(list);
                setActiveTeamId(list[0]?._id ?? null);
            } catch (err) {
                toast.error(err.response?.data?.message || "Failed to load your teams.");
                setTeams([]);
            }
        };
        fetchTeams();
    }, []);

    const activeTeam = teams?.find((t) => t._id === activeTeamId) ?? null;
    const viewerIsOwner = Boolean(user && activeTeam && activeTeam.owner._id === user._id);

    const updateTeamInList = (updated) => {
        setTeams((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    };

    const handleTeamCreated = (newTeam) => {
        setTeams((prev) => [...(prev ?? []), newTeam]);
        setActiveTeamId(newTeam._id);
        setShowCreateForm(false);
    };

    const handlePickMember = (candidate) => {
        setStagedMembers((prev) =>
            prev.some((m) => m._id === candidate._id) ? prev : [...prev, { ...candidate, role: "Editor" }]
        );
    };

    const handleRemoveStaged = (userId) => {
        setStagedMembers((prev) => prev.filter((m) => m._id !== userId));
    };

    const handleChangeStagedRole = (userId, role) => {
        setStagedMembers((prev) => prev.map((m) => (m._id === userId ? { ...m, role } : m)));
    };

    const handleSaveNewMembers = async () => {
        try {
            setIsSaving(true);
            const members = [
                ...activeTeam.members.map((m) => ({ user: m.user._id, role: m.role })),
                ...stagedMembers.map((m) => ({ user: m._id, role: m.role })),
            ];
            const response = await axios.patch(
                `${import.meta.env.VITE_API_BASE_URL}/api/team/update/${activeTeam._id}`,
                { members },
                { withCredentials: true }
            );
            updateTeamInList(response.data.team);
            setStagedMembers([]);
            toast.success("Team updated");
        } catch (err) {
            toast.error(err.response?.data?.message || "Could not update team.");
        } finally {
            setIsSaving(false);
        }
    };

    // Helper Functions
    const handleChangeRole = async (userId, role) => {
        try {
            const members = activeTeam.members.map((m) =>
                m.user._id === userId ? { user: userId, role } : { user: m.user._id, role: m.role }
            );
            const response = await axios.patch(
                `${import.meta.env.VITE_API_BASE_URL}/api/team/update/${activeTeam._id}`,
                { members },
                { withCredentials: true }
            );
            updateTeamInList(response.data.team);
            toast.success("Role updated");
        } catch (err) {
            toast.error(err.response?.data?.message || "Could not update role.");
        }
    };

    const handleRemoveMember = async (userId) => {
        try {
            const members = activeTeam.members
                .filter((m) => m.user._id !== userId)
                .map((m) => ({ user: m.user._id, role: m.role }));
            const response = await axios.patch(
                `${import.meta.env.VITE_API_BASE_URL}/api/team/update/${activeTeam._id}`,
                { members },
                { withCredentials: true }
            );
            updateTeamInList(response.data.team);
            toast.success("Member removed");
        } catch (err) {
            toast.error(err.response?.data?.message || "Could not remove member.");
        }
    };

    const handleDeleteTeam = async () => {
        if (!teamPendingDelete) return;
        try {
            setIsDeleting(true);
            await axios.delete(
                `${import.meta.env.VITE_API_BASE_URL}/api/team/${teamPendingDelete._id}`,
                { withCredentials: true }
            );
            const remaining = teams.filter((t) => t._id !== teamPendingDelete._id);
            setTeams(remaining);
            setActiveTeamId(remaining[0]?._id ?? null);
            toast.success("Team deleted");
            setTeamPendingDelete(null);
        } catch (err) {
            toast.error(err.response?.data?.message || "Could not delete team.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (teams === null) {
        return (
            <div className="space-y-2 max-w-md">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-14 rounded-lg border border-divider bg-input animate-pulse" />
                ))}
            </div>
        );
    }

    if (teams.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-24 max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-full bg-input border border-divider flex items-center justify-center mb-4">
                    <TeamIcon className="w-5 h-5 text-accent-color" />
                </div>
                <h2 className="text-primary font-medium">No teams yet</h2>
                <p className="text-secondary text-sm mt-1 mb-5">
                    Create a team to start inviting people to work with you.
                </p>
                <CreateTeamForm onCreated={handleTeamCreated} />
            </div>
        );
    }

    const existingIds = activeTeam ? activeTeam.members.map((m) => m.user._id) : [];
    const stagedIds = stagedMembers.map((m) => m._id);

    return (
        <div className="max-w-2xl">
            {/* Team switcher — every team the user owns or belongs to, plus a
                way to create another one without leaving the page. */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-6">
                {teams.map((t) => (
                    <button
                        key={t._id}
                        type="button"
                        onClick={() => {
                            setActiveTeamId(t._id);
                            setStagedMembers([]);
                        }}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                            t._id === activeTeamId
                                ? "bg-brand text-main"
                                : "bg-input border border-divider text-secondary hover:text-primary"
                        }`}
                    >
                        {t.name}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={() => setShowCreateForm((v) => !v)}
                    aria-label="Create new team"
                    className="shrink-0 w-8 h-8 rounded-lg border border-dashed border-divider text-accent-color hover:text-brand hover:border-brand transition-colors cursor-pointer flex items-center justify-center text-lg leading-none"
                >
                    +
                </button>
            </div>

            {showCreateForm && (
                <div className="mb-6">
                    <CreateTeamForm onCreated={handleTeamCreated} onCancel={() => setShowCreateForm(false)} />
                </div>
            )}

            {activeTeam && (
                <>
                    <div className="flex items-center justify-between mb-1">
                        <h1 className="text-xl font-semibold text-primary">{activeTeam.name}</h1>
                        <div className="flex items-center gap-3">
                            <p className="text-secondary text-sm">
                                {activeTeam.members.length + stagedMembers.length + 1} member
                                {activeTeam.members.length + stagedMembers.length !== 0 ? "s" : ""}
                            </p>
                            {viewerIsOwner && (
                                <button
                                    type="button"
                                    onClick={() => setTeamPendingDelete(activeTeam)}
                                    aria-label="Delete team"
                                    className="text-accent-color hover:text-danger transition-colors cursor-pointer"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {viewerIsOwner && (
                        <>
                            <p className="text-secondary text-sm mb-5">Search for people by username or email to invite them.</p>
                            <MemberSearch excludeIds={[...existingIds, ...stagedIds]} onPick={handlePickMember} />
                        </>
                    )}

                    <div className="mt-5 space-y-2">
                        <MemberRow user={activeTeam.owner} role="Owner" isRowOwner viewerIsOwner={viewerIsOwner} />
                        {activeTeam.members.map((m) => (
                            <MemberRow
                                key={m.user._id}
                                user={m.user}
                                role={m.role}
                                isRowOwner={false}
                                viewerIsOwner={viewerIsOwner}
                                onRoleChange={(role) => handleChangeRole(m.user._id, role)}
                                onRemove={() => handleRemoveMember(m.user._id)}
                            />
                        ))}
                        {stagedMembers.map((m) => (
                            <MemberRow
                                key={m._id}
                                user={m}
                                role={m.role}
                                isRowOwner={false}
                                viewerIsOwner
                                pending
                                onRoleChange={(role) => handleChangeStagedRole(m._id, role)}
                                onRemove={() => handleRemoveStaged(m._id)}
                            />
                        ))}
                    </div>

                    {stagedMembers.length > 0 && (
                        <div className="flex items-center gap-3 mt-5">
                            <button
                                type="button"
                                onClick={handleSaveNewMembers}
                                disabled={isSaving}
                                className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand text-main hover:brightness-110 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
                            >
                                {isSaving ? "Saving…" : `Save ${stagedMembers.length} new member${stagedMembers.length !== 1 ? "s" : ""}`}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStagedMembers([])}
                                className="text-sm text-accent-color hover:text-primary transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </>
            )}

            <Modal
                title="Delete team?"
                content={
                    teamPendingDelete
                        ? `This will permanently delete "${teamPendingDelete.name}" and remove all its members. This can't be undone.`
                        : ""
                }
                display={Boolean(teamPendingDelete)}
                onConfirm={handleDeleteTeam}
                onCancel={() => !isDeleting && setTeamPendingDelete(null)}
            />
        </div>
    );
}