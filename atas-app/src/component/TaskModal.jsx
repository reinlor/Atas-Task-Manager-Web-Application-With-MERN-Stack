import { useEffect, useRef, useState } from 'react'


export default function TaskModal({
    onDelete, onShare, display, onClose
}) {
    const [showCollab, setShowCollab] = useState(false)
    const taskModalRef = useRef()

    useEffect(() => {
        const thisRef = taskModalRef.current;
        console.log(thisRef.open)
        if(!thisRef) return
        if (display && !thisRef.open) thisRef.showModal();
        else if (!display && thisRef.open) thisRef.close();
    }, [display])

    return (
        <dialog 
            ref={taskModalRef}

            className="m-auto w-[calc(100%-2rem)] max-w-sm max-h-[80vh] overflow-y-auto
                bg-input border border-divider rounded-2xl p-6 shadow-2xl shadow-black/40
                text-primary
                backdrop:bg-black/60 backdrop:backdrop-blur-[2px]">
            {showCollab ? <CollabList/> : <div className='flex flex-col gap-3'>
                {/* Share Button */}
                <button 
                    onClick={onShare}
                    className='text-brand hover:text-primary transition-colors cursor-pointer -mt-1 -mr-1 text-md leading-none'>
                    Share
                </button> <hr className='border-secondary'/>

                {/* Delete Button */}
                <button 
                    onClick={onDelete}
                    className='text-red-400 hover:text-primary transition-colors cursor-pointer -mt-1 -mr-1 text-md leading-none'>
                    Delete
                </button> <hr className='border-secondary'/>

                {/* Back Button */}
                <button 
                    onClick={onClose}
                    className='text-accent-color hover:text-primary transition-colors cursor-pointer -mt-1 -mr-1 text-md leading-none'>
                    Back
                </button>
            </div>}
        </dialog>
    )
}

function CollabList(){
    

    return(
        <div>
            <h2>Add Collaborators</h2>
            <hr/>

        </div>
    )
}
