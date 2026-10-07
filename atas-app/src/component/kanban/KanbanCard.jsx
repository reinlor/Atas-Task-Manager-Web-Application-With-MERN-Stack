import { memo } from "react";
import { Draggable } from "@hello-pangea/dnd";
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
          className={`w-full rounded-lg border bg-main text-sm text-primary shadow-sm transition-[border-color,box-shadow] ${
            snapshot.isDragging
              ? "scale-[1.02] border-brand shadow-lg"
              : "border-divider hover:border-brand/40"
          }`}
        >
          <div
            {...provided.dragHandleProps}
            className="flex cursor-grab touch-none items-center gap-2 rounded-t-lg px-3 pt-3 active:cursor-grabbing"
          >
            <span aria-hidden="true" className="text-accent-color">⠿</span>
            <span className="min-w-0 flex-1 truncate font-medium">{card.title}</span>
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
            className="cursor-pointer px-3 pb-3 pt-1"
            aria-label={`Open card ${card.title}`}
          >
            {card.description && (
              <MarkdownContent className="line-clamp-3 break-words text-xs text-secondary [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_a]:text-brand [&_a]:underline [&_code]:rounded [&_code]:bg-[#161616] [&_code]:px-1 [&_code]:font-mono">
                {card.description}
              </MarkdownContent>
            )}
          </div>
        </article>
      )}
    </Draggable>
  );
}

export default memo(KanbanCard);
