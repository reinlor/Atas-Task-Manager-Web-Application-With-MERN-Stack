import { useCallback, useEffect, useRef } from "react";

const EDGE_SIZE = 72;
const MAX_SCROLL_PER_FRAME = 18;

export function useKanbanAutoScroll() {
  const containerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const pointerXRef = useRef(null);
  const animationFrameRef = useRef(null);

  const stop = useCallback(() => {
    isDraggingRef.current = false;
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const container = containerRef.current;
    const pointerX = pointerXRef.current;
    if (!isDraggingRef.current || !container || pointerX === null) {
      animationFrameRef.current = null;
      return;
    }

    const bounds = container.getBoundingClientRect();
    const edgeSize = Math.min(EDGE_SIZE, bounds.width / 3);
    let direction = 0;
    let edgeDistance = 0;

    if (pointerX < bounds.left + edgeSize) {
      direction = -1;
      edgeDistance = bounds.left + edgeSize - pointerX;
    } else if (pointerX > bounds.right - edgeSize) {
      direction = 1;
      edgeDistance = pointerX - (bounds.right - edgeSize);
    }

    if (direction !== 0) {
      const intensity = Math.min(edgeDistance / edgeSize, 1);
      const previousScrollLeft = container.scrollLeft;
      container.scrollLeft +=
        direction * Math.max(2, intensity * MAX_SCROLL_PER_FRAME);
      if (container.scrollLeft === previousScrollLeft) {
        animationFrameRef.current = null;
        return;
      }
      animationFrameRef.current = requestAnimationFrame(tick);
      return;
    }

    animationFrameRef.current = null;
  }, []);

  const schedule = useCallback(() => {
    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  useEffect(() => {
    const updatePointer = (clientX) => {
      pointerXRef.current = clientX;
      if (isDraggingRef.current) schedule();
    };
    const onPointerMove = (event) => {
      updatePointer(event.clientX);
    };
    const onMouseMove = (event) => {
      updatePointer(event.clientX);
    };
    const onTouchMove = (event) => {
      const touch = event.touches[0] ?? event.changedTouches[0];
      if (touch) updatePointer(touch.clientX);
    };

    window.addEventListener("pointermove", onPointerMove, {
      capture: true,
      passive: true,
    });
    window.addEventListener("mousemove", onMouseMove, {
      capture: true,
      passive: true,
    });
    window.addEventListener("touchmove", onTouchMove, {
      capture: true,
      passive: true,
    });
    return () => {
      window.removeEventListener("pointermove", onPointerMove, true);
      window.removeEventListener("mousemove", onMouseMove, true);
      window.removeEventListener("touchmove", onTouchMove, true);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [schedule]);

  const start = useCallback((event) => {
    isDraggingRef.current = true;
    const initialX = event?.client?.selection?.x;
    if (typeof initialX === "number") {
      pointerXRef.current = initialX;
    }
    schedule();
  }, [schedule]);

  const onDragEnd = useCallback(() => {
    stop();
  }, [stop]);

  return { containerRef, onDragStart: start, onDragEnd };
}
