export default function Modal({ 
    message, 
    display,
    buttonContent = { 'Confirm': () => {} } 
}) {
    
    const displayButtons = () => {
        const buttonsArray = Object.entries(buttonContent);

        return (
            <div className="flex gap-2 mt-4">
                {buttonsArray.map(([buttonName, buttonAction]) => {
                    return (
                        <button 
                            key={buttonName} 
                            onClick={buttonAction}
                            className="px-4 py-2 border rounded"
                        >
                            {buttonName}
                        </button>
                    );
                })}
            </div>
        );
    };
    
    return (
        <dialog className={`fixed p-4 border rounded ${display ? 'flex' : 'hidden'}`}>
            <p>{message}</p>
            {displayButtons()} 
        </dialog>
    );
}