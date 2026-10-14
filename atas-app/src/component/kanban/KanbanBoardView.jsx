import { DragDropContext } from "@hello-pangea/dnd";
import { Plus, X } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
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
        className="scrollbar-thin scrollbar-thumb-brand flex min-h-0 flex-1 items-start gap-3 overflow-x-auto overflow-y-hidden pb-2 sm:gap-4"
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
              <Card className="gap-3 border-border bg-card p-3 shadow-none">
                <Badge variant="outline" className="w-fit text-muted-foreground">
                  New column
                </Badge>
                <form onSubmit={onAddColumn} className="flex flex-col gap-3">
                  <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
                    Column name
                    <Input
                      value={newColumnTitle}
                      onChange={(event) => onNewColumnTitleChange(event.target.value)}
                      placeholder="e.g. In review"
                      maxLength={40}
                      autoFocus
                    />
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="submit"
                      disabled={!newColumnTitle.trim()}
                      className="!bg-brand !text-main hover:!bg-brand/90"
                    >
                      <Plus aria-hidden="true" />
                      Add column
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={onCancelAddColumn}
                    >
                      <X aria-hidden="true" />
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            ) : (
              <button
                type="button"
                onClick={onStartAddColumn}
                className="flex min-h-12 w-full items-center gap-2 rounded-xl border border-dashed border-border bg-card/40 px-4 py-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:border-brand/50 hover:bg-brand/5 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus aria-hidden="true" className="size-4" />
                {board.columns.length === 0
                  ? `Add your first column`
                  : `Add column`}
                <Badge variant="outline" className="ml-auto text-muted-foreground">
                  {board.columns.length}/{MAX_COLUMNS}
                </Badge>
              </button>
            )}
          </div>
        )}
        {board.columns.length >= MAX_COLUMNS && (
          <p className="w-[min(84vw,18rem)] shrink-0 px-2 py-3 text-xs text-muted-foreground sm:w-72">
            Maximum of {MAX_COLUMNS} columns reached.
          </p>
        )}
        {board.columns.length === 0 && !canEdit && (
          <p className="w-[min(84vw,18rem)] shrink-0 px-2 py-3 text-xs text-muted-foreground sm:w-72">
            A board owner or team editor can create the first column.
          </p>
        )}
      </div>
    </DragDropContext>
  );
}
