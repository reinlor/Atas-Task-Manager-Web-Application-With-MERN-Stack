import { createContext, useContext, useRef, useCallback } from "react";

const TaskEditorContext = createContext(null);

export function TaskEditorProvider({ children }) {

    const activeTaskRef = useRef(null);

    const registerActiveTask = useCallback((task) => {
        activeTaskRef.current = task;
    }, []);

    const clearActiveTask = useCallback(() => {
        activeTaskRef.current = null;
    }, []);

    const getActiveTask = useCallback(() => activeTaskRef.current, []);

    return (
        <TaskEditorContext.Provider value={{ registerActiveTask, clearActiveTask, getActiveTask }}>
            {children}
        </TaskEditorContext.Provider>
    );
}

export function useTaskEditor() {
    const ctx = useContext(TaskEditorContext);
    if (!ctx) {
        throw new Error("useTaskEditor must be used within a TaskEditorProvider");
    }
    return ctx;
}