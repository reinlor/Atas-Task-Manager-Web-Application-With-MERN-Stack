export default function TextInput({
    isPassword,
    onClick,
    onChange,
    placeholder,
    className = "",
    name,
    ...props
}) {
    const defaultStyling = "border-2 rounded-sm p-1 w-full"

    return (
        <input
            type={isPassword ? 'password' : 'text'}
            onClick={onClick}
            onChange={onChange}
            placeholder={placeholder}
            className={`${defaultStyling} ${className}`.trim()}
            name={name}
            {...props} 
        />
    )
}