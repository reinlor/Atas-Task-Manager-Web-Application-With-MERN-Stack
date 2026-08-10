import TextInput from "../../component/TextInput";
import Button from "../../component/Button";

export default function ForgotForm({ changeForm, buttonState, handleForgotPassword, onChange, formData }) {
    const { email } = formData

    return (
        <form onSubmit={handleForgotPassword}>
            <fieldset>
                <legend className="sr-only">Reset your password</legend>

                <div>
                    <label htmlFor="email" className="block text-xs font-medium tracking-wide text-secondary mb-1.5">Email</label>
                    <TextInput
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={onChange}
                        placeholder="you@example.com"
                        className="w-full bg-input border border-divider rounded-lg px-3.5 py-2.5 text-sm text-primary placeholder-accent-color/70 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                </div>

                <Button
                    isLoading={buttonState}
                    onClick={handleForgotPassword}
                    cstyle='w-full'
                >Send reset link</Button>

                <p className="text-center text-sm text-secondary mt-6">
                    Remembered it?{' '}
                    <button
                        type="button"
                        onClick={() => changeForm('login')}
                        className="text-brand hover:brightness-110 font-medium cursor-pointer">
                        Back to login
                    </button>
                </p>
            </fieldset>
        </form>
    )
}