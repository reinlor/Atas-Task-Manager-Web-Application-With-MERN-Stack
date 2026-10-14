import { memo, useEffect, useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { Check, Pencil, Plus, X } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
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
    <section className="flex max-h-full w-[min(84vw,19rem)] shrink-0 flex-col rounded-xl border border-border bg-card p-3 shadow-sm sm:w-80 sm:p-4">
      <div className="mb-3 flex min-h-8 items-center justify-between gap-2">
        {isRenaming ? (
          <form onSubmit={submitRename} className="flex min-w-0 flex-1 gap-1">
            <Input
              value={columnTitle}
              onChange={(event) => setColumnTitle(event.target.value)}
              maxLength={40}
              autoFocus
              aria-label="Column name"
            />
            <Button
              type="button"
              onClick={() => {
                setColumnTitle(column.title);
                setIsRenaming(false);
              }}
              variant="ghost"
              size="icon"
              aria-label="Cancel renaming column"
            >
              <X aria-hidden="true" />
            </Button>
            <Button
              type="submit"
              disabled={!columnTitle.trim()}
              variant="ghost"
              size="icon"
              aria-label="Save column name"
              className="text-brand"
            >
              <Check aria-hidden="true" />
            </Button>
          </form>
        ) : (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-brand" />
            <h3 className="min-w-0 truncate text-sm font-semibold text-foreground">
              {column.title}
            </h3>
            {canEdit && (
              <Button
                type="button"
                onClick={() => {
                  setColumnTitle(column.title);
                  setIsRenaming(true);
                }}
                aria-label={`Rename ${column.title} column`}
                variant="ghost"
                size="icon-xs"
                className="shrink-0 text-muted-foreground hover:text-brand"
              >
                <Pencil aria-hidden="true" />
              </Button>
            )}
          </div>
        )}
        <Badge variant="secondary" className="shrink-0">
          {column.cards.length}
        </Badge>
      </div>

      <Droppable droppableId={column._id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`scrollbar-thin scrollbar-thumb-brand flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto rounded-lg p-1 transition-colors ${
              snapshot.isDraggingOver
                ? "border border-dashed border-brand/50 bg-brand/5"
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
            {column.cards.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex min-h-20 items-center justify-center rounded-lg border border-dashed border-border/80 px-3 text-center text-xs text-muted-foreground">
                Drop a card here or add one below.
              </div>
            )}
          </div>
        )}
      </Droppable>

      <div className="mt-3 border-t border-border pt-3">
        {!canEdit ? null : isAddingCard ? (
          <form
            className="flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              submitCard();
            }}
          >
            <Input
              placeholder="Enter card title..."
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              autoFocus
              aria-label="New card title"
            />
            <div className="flex items-center gap-2">
              <Button
                disabled={!title.trim()}
                type="submit"
                className="!bg-brand !text-main hover:!bg-brand/90"
              >
                Add
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsAddingCard(false);
                  setTitle("");
                }}
                variant="ghost"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button
            type="button"
            onClick={() => setIsAddingCard(true)}
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-brand"
          >
            <Plus aria-hidden="true" />
            Add a card
          </Button>
        )}
      </div>
    </section>
  );
}

export default memo(KanbanColumn);
