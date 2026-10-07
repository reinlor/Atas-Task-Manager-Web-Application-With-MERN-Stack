import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import axios from "axios";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import Button from "../component/Button";
import TextInput from "../component/TextInput";
import { useAuth } from "../context/AuthContext";
import CardDetailsModal from "../component/CardDetailModal";

export default function KanbanTest() {
  const { user } = useAuth();
  const [board, setBoard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [activeColumnId, setActiveColumnId] = useState(null);
  const [socket, setSocket] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  // Fetch Board Data & Initialize Socket
  useEffect(() => {
    const fetchOrCreateBoard = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/board/getAll`,
          { withCredentials: true }
        );

        if (response.data && response.data.length > 0) {
          setBoard(response.data[0]);
        } else {
          // Create default board if none exists
          const createRes = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/api/board/create`,
            { title: "My Workspace Board" },
            { withCredentials: true }
          );
          setBoard(createRes.data);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load board.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrCreateBoard();

    // Socket Setup
    const s = io(import.meta.env.VITE_API_BASE_URL, { withCredentials: true });
    setSocket(s);

    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (!socket || !board?._id) return;

    // join targeted board room
    socket.emit("join_board", board._id);

    // Listen for real-time moves from other users
    socket.on("card_moved_sync", ({ cardId, sourceColumnId, destinationColumnId, newPosition }) => {
      setBoard((prevBoard) => {
        if (!prevBoard) return prevBoard;

        let movedCard = null;

        // Extract target card from source column
        const updatedColumns = prevBoard.columns.map((col) => {
          const colCards = [...col.cards];
          if (col._id === sourceColumnId) {
            const cardIdx = colCards.findIndex((c) => c._id === cardId);
            if (cardIdx !== -1) {
              [movedCard] = colCards.splice(cardIdx, 1);
            }
          }
          return { ...col, cards: colCards };
        });

        // Insert card into destination column at target position
        if (movedCard) {
          const destCol = updatedColumns.find((col) => col._id === destinationColumnId);
          if (destCol) {
            destCol.cards.splice(newPosition, 0, movedCard);
          }
        }

        return { ...prevBoard, columns: updatedColumns };
      });
    });

    return () => {
      socket.emit("leave_board", board._id);
      socket.off("card_moved_sync");
    };
  }, [socket, board?._id]);

  // Drag-and-Drop Move with Optimistic UI
  const handleOnDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    const sourceColId = source.droppableId;
    const destColId = destination.droppableId;
    const newPos = destination.index;

    const previousBoardState = { ...board };

    // optimistic state update
    const updatedColumns = board.columns.map((col) => {
      return { ...col, cards: [...col.cards] };
    });

    const sourceColumn = updatedColumns.find((c) => c._id === sourceColId);
    const destColumn = updatedColumns.find((c) => c._id === destColId);

    const [movedCard] = sourceColumn.cards.splice(source.index, 1);
    destColumn.cards.splice(newPos, 0, movedCard);

    setBoard({ ...board, columns: updatedColumns });

    try {
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL}/api/card/move`,
        {
          cardId: draggableId,
          sourceColumnId: sourceColId,
          destinationColumnId: destColId,
          newPosition: newPos,
        },
        { withCredentials: true }
      );

      // Emit Socket event to sync other users connected to the same board room
      socket?.emit("card_moved", {
        boardId: board._id,
        cardId: draggableId,
        sourceColumnId: sourceColId,
        destinationColumnId: destColId,
        newPosition: newPos,
      });
    } catch (err) {
      // 4. Rollback to original state if API call fails
      setBoard(previousBoardState);
      toast.error("Network sync failed. Reverting card position.");
    }
  };

  // Handle Adding New Cards
  const handleAddCard = async (columnId) => {
    if (!newCardTitle.trim()) return;

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/card/create`,
        {
          boardId: board._id,
          columnId,
          title: newCardTitle.trim(),
        },
        { withCredentials: true }
      );

      const createdCard = res.data;

      setBoard((prevBoard) => ({
        ...prevBoard,
        columns: prevBoard.columns.map((col) =>
          col._id === columnId
            ? { ...col, cards: [...col.cards, createdCard] }
            : col
        ),
      }));

      setNewCardTitle("");
      setActiveColumnId(null);
      toast.success("Card created!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create card.");
    }
  };

  if (isLoading) {
    return <div className="p-6 text-secondary text-sm">Loading board...</div>;
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-primary">{board?.title}</h2>
        <span className="text-xs text-accent-color font-mono">Real-time Sync Active</span>
      </div>

      <DragDropContext onDragEnd={handleOnDragEnd}>
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4 items-start">
          {board?.columns?.map((column) => (
            <div
              key={column._id}
              className="w-72 shrink-0 bg-input border border-divider rounded-xl p-3 flex flex-col max-h-full"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-semibold text-primary">{column.title}</h3>
                <span className="text-xs text-secondary bg-main px-2 py-0.5 rounded-full border border-divider">
                  {column.cards.length}
                </span>
              </div>

              {/* Cards List (Droppable Area) */}
              <Droppable droppableId={column._id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 flex flex-col gap-2 overflow-y-auto min-h-[100px] p-1 rounded-lg transition-colors ${snapshot.isDraggingOver ? "bg-brand/5 border border-dashed border-brand/30" : ""
                      }`}
                  >
                    {column.cards.map((card, index) => (
                      <Draggable key={card._id} draggableId={card._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => setSelectedCard(card)}
                            className={`p-3 rounded-lg border bg-main text-primary text-sm shadow-sm transition-all cursor-pointer ${snapshot.isDragging ? "border-brand shadow-lg scale-105" : "border-divider hover:border-brand/40"
                              }`}
                          >
                            <p className="font-medium">{card.title}</p>
                            {card.description && (
                              <p className="text-xs text-secondary mt-1 line-clamp-2">
                                {card.description}
                              </p>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {/* Add Card Form */}
              <div className="mt-3 pt-2 border-t border-divider">
                {activeColumnId === column._id ? (
                  <div className="flex flex-col gap-2">
                    <TextInput
                      placeholder="Enter card title..."
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Button onClick={() => handleAddCard(column._id)}>Add</Button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveColumnId(null);
                          setNewCardTitle("");
                        }}
                        className="text-xs text-secondary hover:text-primary transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveColumnId(column._id)}
                    className="w-full text-left text-xs font-medium text-secondary hover:text-brand transition-colors p-1 cursor-pointer"
                  >
                    + Add a card
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </DragDropContext>

      <CardDetailsModal
        card={selectedCard}
        isOpen={Boolean(selectedCard)}
        onClose={() => setSelectedCard(null)}
        onCardUpdated={(updatedCard) => {
          setBoard((prev) => ({
            ...prev,
            columns: prev.columns.map((col) => ({
              ...col,
              cards: col.cards.map((c) => (c._id === updatedCard._id ? updatedCard : c)),
            })),
          }));
        }}
        onCardDeleted={(deletedCardId) => {
          setBoard((prev) => ({
            ...prev,
            columns: prev.columns.map((col) => ({
              ...col,
              cards: col.cards.filter((c) => c._id !== deletedCardId),
            })),
          }));
        }}
      /><CardDetailsModal
        card={selectedCard}
        isOpen={Boolean(selectedCard)}
        onClose={() => setSelectedCard(null)}
        onCardUpdated={(updatedCard) => {
          setBoard((prev) => ({
            ...prev,
            columns: prev.columns.map((col) => ({
              ...col,
              cards: col.cards.map((c) => (c._id === updatedCard._id ? updatedCard : c)),
            })),
          }));
        }}
        onCardDeleted={(deletedCardId) => {
          setBoard((prev) => ({
            ...prev,
            columns: prev.columns.map((col) => ({
              ...col,
              cards: col.cards.filter((c) => c._id !== deletedCardId),
            })),
          }));
        }}
      />
    </div>
  );
}