import { useState } from "react"
import axios from "axios";
import Button from "../component/Button"
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import TextInput from "../component/TextInput";
import AuthLayout from "./login/AuthLayout";

export default function ForgotPass() {
    const [searchParams] = useSearchParams();
    const [pass, setPass] = useState({
        newPass: '',
        confirmPass: ''
    })
    const [buttonLoading, setButtonLoading] = useState(false)

    const [showPass, setShowPass] = useState(false)
    const { newPass, confirmPass } = pass;
    const token = searchParams.get('token')

    const passwordsMismatch = newPass.length > 0 && confirmPass.length > 0 && newPass !== confirmPass
    const canSubmit = newPass.length >= 8 && newPass === confirmPass

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPass(prev => ({ ...prev, [name]: value }));
    }

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        try {
            setButtonLoading(true)
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/account/newPass`, {
                token: token,
                newPassword: newPass,
                confirmPassword: confirmPass
            })
            toast.success(response?.data?.message)
        } catch (error) {
            toast.error(error?.response?.data?.error)
        } finally {
            setButtonLoading(false)
        }
    }

    const fieldClass = (invalid) => `w-full bg-input border rounded-lg px-3.5 py-2.5 text-sm text-primary placeholder-[var(--color-accent-color)]/70 outline-none transition-colors focus:ring-2 ${
        invalid
            ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20'
            : 'border-divider focus:border-[var(--color-brand)] focus:ring-[var(--color-brand)]/20'
    }`

    return (
        <main className="flex justify-center items-center w-full min-h-svh bg-main p-4 md:p-8">
            <AuthLayout
                eyebrow="Reset password"
                title="Set a new password"
                subtitle="Choose something secure you haven't used before."
            >
                <form onSubmit={handlePasswordChange}>
                    <fieldset>
                        <legend className="sr-only">Enter your new password</legend>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="newPass" className="block text-xs font-medium tracking-wide text-secondary mb-1.5">
                                    New password
                                </label>
                                <TextInput
                                    isPassword={!showPass}
                                    id="newPass"
                                    name="newPass"
                                    onChange={handleInputChange}
                                    value={newPass}
                                    placeholder="At least 8 characters"
                                    className={fieldClass(false)}
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="confirmPass" className="text-xs font-medium tracking-wide text-secondary">
                                        Confirm password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="text-xs text-accent-color hover:text-primary transition-colors cursor-pointer"
                                    >
                                        {showPass ? "Hide" : "Show"}
                                    </button>
                                </div>
                                <TextInput
                                    isPassword={!showPass}
                                    id="confirmPass"
                                    name="confirmPass"
                                    onChange={handleInputChange}
                                    value={confirmPass}
                                    className={fieldClass(passwordsMismatch)}
                                />
                                {/* Only appears once both fields have content — showing
                                    "doesn't match" while the user is one keystroke into
                                    typing would just be noise, not feedback. */}
                                {passwordsMismatch && (
                                    <p className="text-xs text-danger mt-1.5">Passwords don't match.</p>
                                )}
                            </div>

                            <Button
                                isLoading={buttonLoading}
                                onClick={handlePasswordChange}
                                disabled={!canSubmit}
                                cstyle={'w-full !bg-[var(--color-brand)] !text-main font-semibold hover:brightness-110 mt-2 disabled:opacity-50 disabled:cursor-not-allowed'}
                            >Confirm</Button>
                        </div>
                    </fieldset>
                </form>
            </AuthLayout>
        </main>
    )
}   