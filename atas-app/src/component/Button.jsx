// Button.jsx
export default function Button({ children, onClick, isLoading, disabled, cstyle, type = "button",
  color = {
    main: "bg-indigo-500",
    hover: "bg-indigo-400",
    active: "bg-indigo-600",
    loading: "bg-indigo-400"
  }, ...props }) {
  const { hover, main, active, loading } = color;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`inline-flex items-center justify-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white transition ease-in-out duration-150 cursor-pointer
        ${cstyle}
        ${isLoading
          ? `${loading} cursor-not-allowed`
          : `${main} hover:${hover} active:${active}`
        }`}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://w3.org" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
}
