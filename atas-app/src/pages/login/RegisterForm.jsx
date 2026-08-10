import { useState } from "react";
import Button from "../../component/Button";
import TextInput from "../../component/TextInput";

export default function RegisterForm({ changeForm, onChange, formData, handleRegister, buttonState }) {
    const [showPass, setShowPass] = useState(false);
    const { email, password, username } = formData

    return (
        <form onSubmit={handleRegister}>
            <fieldset>
                <legend className="sr-only">Create your account</legend>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-xs font-medium tracking-wide text-secondary mb-1.5">Email</label>
                        <TextInput
                            type="email"
                            id="email"
                            name="email"
                            placeholder="you@example.com"
                            onChange={onChange}
                            value={email}
                            className="w-full bg-input border border-divider rounded-lg px-3.5 py-2.5 text-sm text-primary placeholder-accent-color/70 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                        />
                    </div>

                    <div>
                        <label htmlFor="username" className="block text-xs font-medium tracking-wide text-secondary mb-1.5">Username</label>
                        <TextInput
                            type="text"
                            id="username"
                            placeholder="jane_doe"
                            name="username"
                            onChange={onChange}
                            value={username}
                            className="w-full bg-input border border-divider rounded-lg px-3.5 py-2.5 text-sm text-primary placeholder-accent-color/70 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label htmlFor="password" className="text-xs font-medium tracking-wide text-secondary">Password</label>
                            <button
                                type="button" onClick={() => setShowPass(!showPass)}
                                className="text-xs text-accent-color hover:text-primary transition-colors cursor-pointer">
                                {showPass ? "Hide" : "Show"}
                            </button>
                        </div>
                        <TextInput
                            isPassword={!showPass}
                            placeholder="At least 8 characters"
                            id="password"
                            onChange={onChange}
                            value={password}
                            name="password"
                            className="w-full bg-input border border-divider rounded-lg px-3.5 py-2.5 text-sm text-primary placeholder-accent-color/70 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                        />
                    </div>

                    <Button
                        onClick={handleRegister}
                        isLoading={buttonState}
                        cstyle='w-full'
                    >Create account</Button>
                </div>

                <p className="text-center text-sm text-secondary mt-6">
                    Already have an account?{' '}
                    <button
                        type="button"
                        onClick={() => changeForm('login')}
                        className="text-brand hover:brightness-110 font-medium cursor-pointer">
                        Log in
                    </button>
                </p>
            </fieldset>
        </form>
    )
}