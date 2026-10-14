import { memo } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";
import { Card } from "../../components/ui/card";
import MarkdownContent from "../MarkdownContent";

function KanbanCard({ card, index, onSelect, canEdit }) {
  return (
    <Draggable
      draggableId={card._id}
      index={index}
      disableInteractiveElementBlocking
      isDragDisabled={!canEdit}
    >
      {(provided, snapshot) => (
        <article
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`w-full rounded-xl ${
            snapshot.isDragging
              ? "scale-[1.02] rotate-1"
              : ""
          }`}
        >
          <Card
            size="sm"
            className={`gap-0 border-border bg-background py-0 text-foreground shadow-sm transition-[border-color,box-shadow] ${
              snapshot.isDragging
                ? "border-brand shadow-xl ring-brand/30"
                : "hover:border-brand/40 hover:shadow-md"
            }`}
          >
            <div
              {...provided.dragHandleProps}
              className={`flex cursor-grab touch-none items-center gap-2 rounded-t-xl px-3 pt-3 active:cursor-grabbing ${
                canEdit ? "" : "cursor-default"
              }`}
              aria-label={canEdit ? `Drag ${card.title}` : undefined}
            >
              <GripVertical
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground/70"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {card.title}
              </span>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={() => onSelect(card)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(card);
                }
              }}
              className="cursor-pointer px-3 pb-3 pt-1 outline-none focus-visible:rounded-b-xl focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              aria-label={`Open card ${card.title}`}
            >
              {card.description ? (
                <MarkdownContent className="line-clamp-3 break-words text-xs leading-relaxed text-muted-foreground [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_a]:text-brand [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:font-mono">
                  {card.description}
                </MarkdownContent>
              ) : (
                <p className="text-xs text-muted-foreground/70">
                  No description
                </p>
              )}
            </div>
          </Card>
        </article>
      )}
    </Draggable>
  );
}

export default memo(KanbanCard);
