import { memo, useEffect, useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import Button from "../Button";
import TextInput from "../TextInput";
import KanbanCard from "./KanbanCard";

function KanbanColumn({
  column,
  onAddCard,
  onSelectCard,
  onRenameColumn,
  canEdit,
}) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [title, setTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [columnTitle, setColumnTitle] = useState(column.title);

  useEffect(() => {
    setColumnTitle(column.title);
  }, [column.title]);

  const submitCard = async () => {
    if (!title.trim()) return;
    const wasCreated = await onAddCard(column._id, title.trim());
    if (wasCreated) {
      setTitle("");
      setIsAddingCard(false);
    }
  };

  const submitRename = async (event) => {
    event.preventDefault();
    if (!columnTitle.trim()) return;
    const renamed = await onRenameColumn(column._id, columnTitle.trim());
    if (renamed) setIsRenaming(false);
  };

  return (
    <section className="flex max-h-full w-[min(84vw,18rem)] shrink-0 flex-col rounded-xl border border-divider bg-input p-3 sm:w-72">
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        {isRenaming ? (
          <form onSubmit={submitRename} className="flex min-w-0 flex-1 gap-1">
            <TextInput
              value={columnTitle}
              onChange={(event) => setColumnTitle(event.target.value)}
              maxLength={40}
              autoFocus
            />
            <Button type="submit" disabled={!columnTitle.trim()}>
              Save
            </Button>
            <button
              type="button"
              onClick={() => {
                setColumnTitle(column.title);
                setIsRenaming(false);
              }}
              className="cursor-pointer text-xs text-secondary hover:text-primary"
            >
              Cancel
            </button>
          </form>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h3 className="min-w-0 truncate text-sm font-semibold text-primary">
              {column.title}
            </h3>
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setColumnTitle(column.title);
                  setIsRenaming(true);
                }}
                aria-label={`Rename ${column.title} column`}
                className="shrink-0 cursor-pointer text-[11px] text-secondary hover:text-brand"
              >
                Rename
              </button>
            )}
          </div>
        )}
        <span className="shrink-0 rounded-full border border-divider bg-main px-2 py-0.5 text-xs text-secondary">
          {column.cards.length}
        </span>
      </div>

      <Droppable droppableId={column._id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto rounded-lg p-1 transition-colors ${
              snapshot.isDraggingOver
                ? "border border-dashed border-brand/30 bg-brand/5"
                : ""
            }`}
          >
            {column.cards.map((card, index) => (
              <KanbanCard
                key={card._id}
                card={card}
                index={index}
                onSelect={onSelectCard}
                canEdit={canEdit}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <div className="mt-3 border-t border-divider pt-2">
        {!canEdit ? null : isAddingCard ? (
          <form
            className="flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              submitCard();
            }}
          >
            <TextInput
              placeholder="Enter card title..."
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button disabled={!title.trim()} type="submit">
                Add
              </Button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingCard(false);
                  setTitle("");
                }}
                className="cursor-pointer text-xs text-secondary transition-colors hover:text-primary"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAddingCard(true)}
            className="w-full cursor-pointer p-1 text-left text-xs font-medium text-secondary transition-colors hover:text-brand"
          >
            + Add a card
          </button>
        )}
      </div>
    </section>
  );
}

export default memo(KanbanColumn);
