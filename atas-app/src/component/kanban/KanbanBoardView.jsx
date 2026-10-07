import { DragDropContext } from "@hello-pangea/dnd";
import Button from "../Button";
import TextInput from "../TextInput";
import KanbanColumn from "./KanbanColumn";
import { useKanbanAutoScroll } from "../../hooks/useKanbanAutoScroll";

const MAX_COLUMNS = 6;

export default function KanbanBoardView({
  board,
  canEdit,
  onDragEnd,
  onAddCard,
  onSelectCard,
  onRenameColumn,
  isAddingColumn,
  newColumnTitle,
  onNewColumnTitleChange,
  onAddColumn,
  onCancelAddColumn,
  onStartAddColumn,
}) {
  const { containerRef, onDragStart, onDragEnd: stopAutoScroll } =
    useKanbanAutoScroll();

  return (
    <DragDropContext
      onDragStart={onDragStart}
      onDragEnd={(result) => {
        stopAutoScroll();
        onDragEnd(result);
      }}
    >
      <div
        ref={containerRef}
        className="-mx-4 flex min-h-0 flex-1 items-start gap-3 overflow-x-auto overflow-y-hidden px-4 pb-4 sm:mx-0 sm:gap-4 sm:px-0"
      >
        {board.columns.map((column) => (
          <KanbanColumn
            key={column._id}
            column={column}
            onAddCard={onAddCard}
            onSelectCard={onSelectCard}
            onRenameColumn={onRenameColumn}
            canEdit={canEdit}
          />
        ))}
        {canEdit && board.columns.length < MAX_COLUMNS && (
          <div className="w-[min(84vw,18rem)] shrink-0 sm:w-72">
            {isAddingColumn ? (
              <form
                onSubmit={onAddColumn}
                className="flex flex-col gap-2 rounded-xl border border-divider bg-input p-3"
              >
                <label className="text-xs font-medium text-secondary">
                  New column name
                </label>
                <TextInput
                  value={newColumnTitle}
                  onChange={(event) => onNewColumnTitleChange(event.target.value)}
                  placeholder="e.g. In review"
                  maxLength={40}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button type="submit" disabled={!newColumnTitle.trim()}>
                    Add column
                  </Button>
                  <button
                    type="button"
                    onClick={onCancelAddColumn}
                    className="cursor-pointer text-xs text-secondary hover:text-primary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={onStartAddColumn}
                className="w-full rounded-xl border border-dashed border-divider px-4 py-3 text-left text-sm text-secondary transition-colors hover:border-brand hover:text-brand"
              >
                {board.columns.length === 0
                  ? `+ Add your first column (0/${MAX_COLUMNS})`
                  : `+ Add column (${board.columns.length}/${MAX_COLUMNS})`}
              </button>
            )}
          </div>
        )}
        {board.columns.length >= MAX_COLUMNS && (
          <p className="w-[min(84vw,18rem)] shrink-0 px-2 py-3 text-xs text-secondary sm:w-72">
            Maximum of {MAX_COLUMNS} columns reached.
          </p>
        )}
        {board.columns.length === 0 && !canEdit && (
          <p className="w-[min(84vw,18rem)] shrink-0 px-2 py-3 text-xs text-secondary sm:w-72">
            A board owner or team editor can create the first column.
          </p>
        )}
      </div>
    </DragDropContext>
  );
}
