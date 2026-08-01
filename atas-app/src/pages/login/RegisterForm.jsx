import { useState } from "react";

const styles = {
    card: "flex flex-col justify-center rounded-sm border-2 w-120 p-3",
    button: "text-center w-full p-1 border-3 rounded-sm mb-4 cursor-pointer",
    input: "border-3 rounded-sm p-1 w-full"
};

export default function RegisterForm({ changeForm, onChange, formData, handleRegister }) {
    const [showPass, setShowPass] = useState(false);
    const {email, password, username} = formData

    return (
        <article className={styles.card}>
            <h1 className="text-center">Register</h1>

            <form>
                <fieldset>
                    <legend className="text-center pb-3 text-xs">Enter the credentials your credentials to register</legend>

                    {/* Username */}
                    <div>
                        <label htmlFor="username">Username</label>
                        <input
                            type="input"
                            placeholder="username"
                            name="username"
                            className={styles.input} 
                            onChange={onChange}
                            value={username}/>
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
                        <input
                            type={showPass ? "text" : "password"}
                            placeholder="password"
                            className={styles.input} 
                            onChange={onChange}
                            value={password}
                            name="password"
                            />
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            placeholder="sample@email.com"
                            id="email"
                            name="email"
                            className={styles.input} 
                            onChange={onChange}
                            value={email}/>
                    </div>

                    {/* Go Back to Login Card */}
                    <button
                        type="button"
                        onClick={() => changeForm('login')}
                        className="underline text-gray-600 cursor-pointer pb-4 text-sm">Login Page</button>

                    {/* Register Button */}
                    <button
                        type="submit"
                        className={`${styles.button} bg-green-400`}
                        onClick={handleRegister}>Register</button>
                </fieldset>
            </form>
        </article>
    )
}