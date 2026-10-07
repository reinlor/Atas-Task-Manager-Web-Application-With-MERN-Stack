import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import Button from "../component/Button";
import TextInput from "../component/TextInput";
import KanbanBoardView from "../component/kanban/KanbanBoardView";
import { useAuth } from "../context/AuthContext";
import CardDetailsModal from "../component/CardDetailModal";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export default function Kanban() {
  const { user } = useAuth();
  const [boards, setBoards] = useState([]);
  const [board, setBoard] = useState(null);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [newBoardTeamId, setNewBoardTeamId] = useState("");
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [isRenamingBoard, setIsRenamingBoard] = useState(false);
  const [boardTitleDraft, setBoardTitleDraft] = useState("");

  const ownedTeams = useMemo(
    () =>
      teams.filter(
        (team) => String(team.owner?._id) === String(user?._id),
      ),
    [teams, user?._id],
  );
  const isBoardOwner =
    board && String(board.owner?._id ?? board.owner) === String(user?._id);
  const boardTeamId = board?.team?._id ?? board?.team;
  const boardTeam = teams.find((team) => team._id === boardTeamId);
  const isTeamEditor = Boolean(
    boardTeam &&
      (String(boardTeam.owner?._id ?? boardTeam.owner) === String(user?._id) ||
        boardTeam.members?.some(
          (member) =>
            String(member.user?._id ?? member.user) === String(user?._id) &&
            member.role === "Editor",
        )),
  );
  const canEditBoard = Boolean(isBoardOwner || isTeamEditor);

  useEffect(() => {
    let isMounted = true;
    const fetchBoards = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/board/getAll`, {
          withCredentials: true,
        });
        if (isMounted) {
          const loadedBoards = response.data ?? [];
          setBoards(loadedBoards);
          setBoard(loadedBoards[0] ?? null);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load boards.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchBoards();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    axios
      .get(`${API_URL}/api/team/get`, { withCredentials: true })
      .then((response) => {
        if (isMounted) setTeams(response.data.teams ?? []);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to load your teams.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const connection = io(API_URL, { withCredentials: true });
    setSocket(connection);
    return () => connection.disconnect();
  }, []);

  useEffect(() => {
    if (!socket || !board?._id) return undefined;

    const onCardMoved = ({
      cardId,
      sourceColumnId,
      destinationColumnId,
      newPosition,
    }) => {
      setBoard((previousBoard) => {
        if (!previousBoard) return previousBoard;

        let movedCard = null;
        const columns = previousBoard.columns.map((column) => {
          if (
            column._id !== sourceColumnId &&
            column._id !== destinationColumnId
          ) {
            return column;
          }
          const cards = [...column.cards];
          if (column._id === sourceColumnId) {
            const cardIndex = cards.findIndex((cardItem) => cardItem._id === cardId);
            if (cardIndex !== -1) [movedCard] = cards.splice(cardIndex, 1);
          }
          return { ...column, cards };
        });

        const destinationColumn = columns.find(
          (column) => column._id === destinationColumnId,
        );
        if (movedCard && destinationColumn) {
          destinationColumn.cards.splice(newPosition, 0, movedCard);
        }
        return { ...previousBoard, columns };
      });
    };

    const onBoardPresence = ({ users }) => setParticipants(users ?? []);
    const onConnect = () => {
      socket.emit("join_board", board._id, (result) => {
        if (result?.error) toast.error(result.error);
      });
    };
    setParticipants([]);
    socket.on("connect", onConnect);
    socket.on("board_presence", onBoardPresence);
    socket.on("card_moved_sync", onCardMoved);
    if (socket.connected) onConnect();
    return () => {
      socket.emit("leave_board", board._id);
      socket.off("connect", onConnect);
      socket.off("board_presence", onBoardPresence);
      socket.off("card_moved_sync", onCardMoved);
    };
  }, [socket, board?._id]);

  useEffect(() => {
    setBoardTitleDraft(board?.title ?? "");
    setIsRenamingBoard(false);
    setIsAddingColumn(false);
  }, [board?._id, board?.title]);

  const handleSelectCard = useCallback((card) => {
    setSelectedCard(card);
  }, []);

  const handleDragEnd = useCallback(
    async (result) => {
      const { source, destination, draggableId } = result;
      if (
        !destination ||
        (source.droppableId === destination.droppableId &&
          source.index === destination.index)
      ) {
        return;
      }

      const previousBoard = board;
      const columns = board.columns.map((column) =>
        column._id === source.droppableId ||
        column._id === destination.droppableId
          ? { ...column, cards: [...column.cards] }
          : column,
      );
      const sourceColumn = columns.find(
        (column) => column._id === source.droppableId,
      );
      const destinationColumn = columns.find(
        (column) => column._id === destination.droppableId,
      );
      if (!sourceColumn || !destinationColumn) return;

      const [movedCard] = sourceColumn.cards.splice(source.index, 1);
      if (!movedCard) return;
      destinationColumn.cards.splice(destination.index, 0, movedCard);
      setBoard({ ...board, columns });

      try {
        await axios.patch(
          `${API_URL}/api/card/move`,
          {
            cardId: draggableId,
            sourceColumnId: source.droppableId,
            destinationColumnId: destination.droppableId,
            newPosition: destination.index,
          },
          { withCredentials: true },
        );
        socket?.emit("card_moved", {
          boardId: board._id,
          cardId: draggableId,
          sourceColumnId: source.droppableId,
          destinationColumnId: destination.droppableId,
          newPosition: destination.index,
        });
      } catch (err) {
        setBoard(previousBoard);
        toast.error(
          err.response?.data?.message ||
            "Network sync failed. Reverting card position.",
        );
      }
    },
    [board, socket],
  );

  const handleAddCard = useCallback(
    async (columnId, title) => {
      try {
        const response = await axios.post(
          `${API_URL}/api/card/create`,
          { boardId: board._id, columnId, title },
          { withCredentials: true },
        );
        const createdCard = response.data;
        setBoard((previousBoard) => ({
          ...previousBoard,
          columns: previousBoard.columns.map((column) =>
            column._id === columnId
              ? { ...column, cards: [...column.cards, createdCard] }
              : column,
          ),
        }));
        toast.success("Card created!");
        return true;
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to create card.");
        return false;
      }
    },
    [board?._id],
  );

  const handleCreateBoard = async (event) => {
    event.preventDefault();
    if (!newBoardTitle.trim()) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/board/create`,
        {
          title: newBoardTitle.trim(),
          ...(newBoardTeamId ? { teamId: newBoardTeamId } : {}),
        },
        { withCredentials: true },
      );
      const createdBoard = response.data;
      setBoards((previousBoards) => [createdBoard, ...previousBoards]);
      setBoard(createdBoard);
      setNewBoardTitle("");
      setNewBoardTeamId("");
      setShowCreateForm(false);
      toast.success("Board created!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create board.");
    }
  };

  const handleAddColumn = async (event) => {
    event.preventDefault();
    if (!newColumnTitle.trim() || !board) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/board/${board._id}/columns`,
        { title: newColumnTitle.trim() },
        { withCredentials: true },
      );
      const createdColumn = response.data.column;
      setBoard((previousBoard) => ({
        ...previousBoard,
        columns: [...previousBoard.columns, createdColumn],
      }));
      setNewColumnTitle("");
      setIsAddingColumn(false);
      toast.success("Column created!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add column.");
    }
  };

  const handleRenameColumn = useCallback(
    async (columnId, title) => {
      try {
        const response = await axios.patch(
          `${API_URL}/api/board/${board._id}/columns/${columnId}`,
          { title },
          { withCredentials: true },
        );
        const renamedColumn = response.data.column;
        setBoard((previousBoard) => ({
          ...previousBoard,
          columns: previousBoard.columns.map((column) =>
            column._id === columnId ? renamedColumn : column,
          ),
        }));
        toast.success("Column renamed.");
        return true;
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to rename column.");
        return false;
      }
    },
    [board?._id],
  );

  const handleRenameBoard = async (event) => {
    event.preventDefault();
    if (!boardTitleDraft.trim() || !board) return;
    const title = boardTitleDraft.trim();
    try {
      await axios.patch(
        `${API_URL}/api/board/update/${board._id}`,
        { title },
        { withCredentials: true },
      );
      setBoard((currentBoard) => ({ ...currentBoard, title }));
      setBoards((currentBoards) =>
        currentBoards.map((item) =>
          item._id === board._id ? { ...item, title } : item,
        ),
      );
      setIsRenamingBoard(false);
      toast.success("Board renamed.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to rename board.");
    }
  };

  const handleShareBoard = async (event) => {
    const teamId = event.target.value;
    try {
      await axios.patch(
        `${API_URL}/api/board/update/${board._id}`,
        { teamId: teamId || null },
        { withCredentials: true },
      );
      const updatedTeamId = teamId || null;
      setBoard((currentBoard) => ({ ...currentBoard, team: updatedTeamId }));
      setBoards((currentBoards) =>
        currentBoards.map((item) =>
          item._id === board._id
            ? { ...item, team: updatedTeamId }
            : item,
        ),
      );
      toast.success(
        teamId ? "Board shared with your team." : "Team access removed.",
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to share the board.");
    }
  };

  const handleCardUpdated = useCallback((updatedCard) => {
    setBoard((previousBoard) => ({
      ...previousBoard,
      columns: previousBoard.columns.map((column) =>
        column.cards.some((card) => card._id === updatedCard._id)
          ? {
              ...column,
              cards: column.cards.map((card) =>
                card._id === updatedCard._id ? updatedCard : card,
              ),
            }
          : column,
      ),
    }));
  }, []);

  const handleCardDeleted = useCallback((deletedCardId) => {
    setBoard((previousBoard) => ({
      ...previousBoard,
      columns: previousBoard.columns.map((column) =>
        column.cards.some((card) => card._id === deletedCardId)
          ? {
              ...column,
              cards: column.cards.filter((card) => card._id !== deletedCardId),
            }
          : column,
      ),
    }));
  }, []);

  if (isLoading) {
    return <div className="p-4 text-sm text-secondary sm:p-6">Loading boards...</div>;
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <label className="text-xs font-medium text-secondary" htmlFor="board-picker">
            Board
          </label>
          <select
            id="board-picker"
            value={board?._id ?? ""}
            onChange={(event) => {
              setBoard(
                boards.find((item) => item._id === event.target.value) ?? null,
              );
            }}
            disabled={boards.length === 0}
            className="w-full min-w-0 rounded-lg border border-divider bg-input px-3 py-2 text-sm text-primary outline-none focus:border-brand sm:w-64"
          >
            {boards.length === 0 && <option value="">No boards yet</option>}
            {boards.map((item) => (
              <option key={item._id} value={item._id}>
                {item.title}
                {String(item.owner?._id ?? item.owner) !== String(user?._id)
                  ? " (shared)"
                  : ""}
              </option>
            ))}
          </select>
          <Button onClick={() => setShowCreateForm((visible) => !visible)}>
            {showCreateForm ? "Cancel" : "New board"}
          </Button>
        </div>
        {board && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            <span>{participants.length} in board room</span>
            {participants.length > 0 && (
              <span className="text-accent-color">
                · {participants.map((participant) => participant.username).join(", ")}
              </span>
            )}
          </div>
        )}
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreateBoard}
          className="flex flex-col gap-3 rounded-xl border border-divider bg-input p-3 sm:flex-row sm:items-end"
        >
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-secondary">
            Board name
            <TextInput
              value={newBoardTitle}
              onChange={(event) => setNewBoardTitle(event.target.value)}
              placeholder="e.g. Product launch"
              maxLength={80}
              autoFocus
            />
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-secondary">
            Share with a team (optional)
            <select
              value={newBoardTeamId}
              onChange={(event) => setNewBoardTeamId(event.target.value)}
              className="w-full rounded-lg border border-divider bg-main px-3 py-2 text-sm text-primary outline-none focus:border-brand"
            >
              <option value="">Keep private</option>
              {ownedTeams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={!newBoardTitle.trim()}>
            Create board
          </Button>
        </form>
      )}

      {!board ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-divider px-4 py-12 text-center">
          <h2 className="text-lg font-semibold text-primary">Create your first board</h2>
          <p className="mt-1 max-w-sm text-sm text-secondary">
            Give it a name, add custom columns, and share it with one of your teams.
          </p>
          {!showCreateForm && (
            <Button cstyle="mt-4" onClick={() => setShowCreateForm(true)}>
              Create a board
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              {isRenamingBoard && isBoardOwner ? (
                <form onSubmit={handleRenameBoard} className="flex gap-2">
                  <TextInput
                    value={boardTitleDraft}
                    onChange={(event) => setBoardTitleDraft(event.target.value)}
                    maxLength={80}
                    autoFocus
                  />
                  <Button type="submit" disabled={!boardTitleDraft.trim()}>
                    Save
                  </Button>
                  <button
                    type="button"
                    onClick={() => setIsRenamingBoard(false)}
                    className="cursor-pointer text-sm text-secondary hover:text-primary"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="min-w-0 break-words text-xl font-bold text-primary">
                    {board.title}
                  </h1>
                  {isBoardOwner && (
                    <button
                      type="button"
                      onClick={() => setIsRenamingBoard(true)}
                      className="cursor-pointer text-xs text-secondary hover:text-brand"
                    >
                      Rename
                    </button>
                  )}
                </div>
              )}
            </div>

            {isBoardOwner && (
              <label className="flex w-full flex-col gap-1 text-xs font-medium text-secondary sm:w-64">
                Share with a team
                <select
                  value={board.team?._id ?? board.team ?? ""}
                  onChange={handleShareBoard}
                  className="w-full rounded-lg border border-divider bg-input px-3 py-2 text-sm text-primary outline-none focus:border-brand"
                >
                  <option value="">Private board</option>
                  {ownedTeams.map((team) => (
                    <option key={team._id} value={team._id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {isBoardOwner && (
            <p className="text-xs text-secondary">
              Team members can access this board. Add or invite members from the{" "}
              <a className="text-brand hover:underline" href="/team">
                Team page
              </a>
              .
            </p>
          )}

          <KanbanBoardView
            board={board}
            canEdit={canEditBoard}
            onDragEnd={handleDragEnd}
            onAddCard={handleAddCard}
            onSelectCard={handleSelectCard}
            onRenameColumn={handleRenameColumn}
            isAddingColumn={isAddingColumn}
            newColumnTitle={newColumnTitle}
            onNewColumnTitleChange={setNewColumnTitle}
            onAddColumn={handleAddColumn}
            onCancelAddColumn={() => {
              setIsAddingColumn(false);
              setNewColumnTitle("");
            }}
            onStartAddColumn={() => setIsAddingColumn(true)}
          />
        </>
      )}

      <CardDetailsModal
        card={selectedCard}
        isOpen={Boolean(selectedCard)}
        onClose={() => setSelectedCard(null)}
        onCardUpdated={handleCardUpdated}
        onCardDeleted={handleCardDeleted}
        canEdit={canEditBoard}
      />
    </div>
  );
}
