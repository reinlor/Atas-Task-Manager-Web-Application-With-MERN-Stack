import { useState } from "react";
import Button from "../../component/Button";
import TextInput from "../../component/TextInput";

const styles = {
    card: "flex flex-col justify-center rounded-sm border-2 w-120 p-3",
    button: "text-center w-full p-1 border-3 rounded-sm mb-4 cursor-pointer",
    input: "border-3 rounded-sm p-1 w-full"
};

export default function RegisterForm({ changeForm, onChange, formData, handleRegister, buttonState }) {
    const [showPass, setShowPass] = useState(false);
    const { email, password, username } = formData

    return (
        <article className={styles.card}>
            <h1 className="text-center">Register</h1>

            <form>
                <fieldset>
                    <legend className="text-center pb-3 text-xs">Enter the credentials your credentials to register</legend>

                    {/* Email */}
                    <div>
                        <label htmlFor="email">Email</label>
                        <TextInput
                            type="email"
                            placeholder="sample@email.com"
                            id="email"
                            name="email"
                            onChange={onChange}
                            value={email} />
                    </div>
                    {/* Password */}
                    <div>
                        <div className="flex justify-between">
                            <label htmlFor="password">Password</label>
                            <button
                                type="button" onClick={() => setShowPass(!showPass)}
                                className="underline cursor-pointer">
                                {showPass ? "Hide" : "Show"}
                            </button>
                        </div>
                        <TextInput
                            isPassword={showPass}
                            placeholder="password"
                            onChange={onChange}
                            value={password}
                            name="password"
                        />
                    </div>
                    {/* Username */}
                    <div>
                        <label htmlFor="username">Username</label>
                        <TextInput
                            type="input"
                            placeholder="username"
                            name="username"
                            onChange={onChange}
                            value={username} />
                    </div>

                    {/* Go Back to Login Card */}
                    <button
                        type="button"
                        onClick={() => changeForm('login')}
                        className="underline text-gray-600 cursor-pointer pb-4 text-sm">Login Page</button>

                    {/* Register Button */}
                    <Button
                        onClick={handleRegister}
                        isLoading={buttonState}
                        cstyle={'w-full'}
                    >Register</Button>
                </fieldset>
            </form>
        </article>
    )
}