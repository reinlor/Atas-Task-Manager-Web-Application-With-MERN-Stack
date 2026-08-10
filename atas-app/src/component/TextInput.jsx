export default function TextInput({
    isPassword,
    onClick,
    onChange,
    placeholder,
    name,
    ...props
}) {

    return (
        <input
            type={isPassword ? 'password' : 'text'}
            onClick={onClick}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-input border border-divider rounded-lg px-3.5 py-2.5 text-sm text-primary placeholder-accent-color/70 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
            name={name}
            {...props} 
        />
    )
}