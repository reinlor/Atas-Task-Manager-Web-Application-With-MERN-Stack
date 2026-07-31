import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios'
import GoogleLoginButton from "../component/GoogleLoginButton";
import { toast } from 'react-toastify';

const styles = {
    card: "flex flex-col justify-center rounded-sm border-2 w-120 p-3",
    button: "text-center w-full p-1 border-3 rounded-sm mb-4 cursor-pointer",
    input: "border-3 rounded-sm p-1 w-full"
};

export default function Login() {
    const [activeForm, setActiveForm] = useState("login");
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const { email, password } = formData;

    // Helpers
    const navigate = useNavigate('/');
    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(
                "http://localhost:3000/api/account/login",
                { email, password },
                { withCredentials: true }
            )

            toast(`Welcome back, ${response.data.username}!`);

            if (response.status === 200) navigate('/dashboard');
        } catch (error) {
            console.error(error.response?.data?.message || 'An error occurred during login.');
            toast('Server Error')
        }
    }

    const handleRegister = () => {
        // Wala pang function (Do not Modify)
    }

    const handleFormChange = () => {
        switch (activeForm) {
            case "login":
                return <LoginForm
                    handleLogin={handleLogin}
                    changeForm={switchForm}
                    formData={formData}
                    onChange={onChange}
                />
            case "register":
                return <RegisterForm
                    changeForm={switchForm}
                />
            case "forgot":
                return <ForgotForm
                    changeForm={switchForm}
                />
            default:
                return <LoginForm
                    handleLogin={handleLogin}
                    changeForm={switchForm}
                />
        }
    }

    const switchForm = (nextForm) => {
        setActiveForm(nextForm);
    }

    return (
        <main className="flex justify-center items-center w-full min-h-svh">
            {
                handleFormChange()
            }
        </main>
    )
}

function LoginForm({ handleLogin, changeForm, formData, onChange }) {
    const [showPass, setShowPass] = useState(false);
    const { email, password } = formData;

    return (
        <article className={styles.card}>
            <h1 className="mb-2 text-center ">Sign-in</h1>

            <form>
                <fieldset>
                    <legend className="text-center text-xs mb-5">Enter your login credentials or sign-in with google</legend>

                    <GoogleLoginButton />

                    <p aria-hidden="true" className="text-center">OR</p>

                    {/* Username field */}
                    <div className="flex flex-col">
                        <label className="">Email</label>
                        <input
                            type="text" id="email" name="email"
                            value={email}
                            className={styles.input}
                            onChange={onChange} />
                    </div>

                    {/* Password Field */}
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
                            type={showPass ? "text" : "password"} id="password" name="password"
                            value={password}
                            className={styles.input}
                            onChange={onChange} />
                    </div>

                    {/* Forgot Password */}
                    <div>
                        <button
                            type="button"
                            onClick={() => changeForm('forgot')}
                            className="underline text-gray-500 text-sm cursor-pointer">Forgot Password</button>
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit" onClick={handleLogin}
                        className={`${styles.button} bg-green-400`}>Log In</button>
                    <button
                        type="submit" onClick={handleLogin}
                        className={`${styles.button} bg-gray-400`}>Guest</button>

                    {/* Register Button */}
                    <p className="text-center">
                        Don't have an account? &nbsp;
                        <button
                            type="button"
                            onClick={() => changeForm('register')}
                            className="text-green-500 cursor-pointer">Register</button>
                    </p>
                </fieldset>
            </form>
        </article>
    )
}

function RegisterForm({ changeForm }) {
    const [showPass, setShowPass] = useState(false);

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
                            className={styles.input} />
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
                            className={styles.input} />
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            placeholder="sample@email.com"
                            id="email"
                            className={styles.input} />
                    </div>

                    {/* Go Back to Login Card */}
                    <button
                        type="button"
                        onClick={() => changeForm('login')}
                        className="underline text-gray-600 cursor-pointer pb-4 text-sm">Login Page</button>

                    {/* Register Button */}
                    <button
                        type="submit"
                        className={`${styles.button} bg-green-400`}>Register</button>
                </fieldset>
            </form>
        </article>
    )
}

function ForgotForm({ changeForm }) {
    return (
        <article className={styles.card}>
            <h1>Password Reset</h1>
            <form>
                <fieldset>
                    <legend>Reset password will be sent on your registered email</legend>

                    <div className="flex flex-col">
                        <label>Email</label>
                        <input
                            type="email"
                            className={styles.input}
                            placeholder="email@sample.com" />
                    </div>
                    <button
                        type="button"
                        onClick={() => changeForm('login')}
                        className="underline text-gray-600 cursor-pointer pb-4 text-sm">Login Page</button>

                    <button
                        type="submit"
                        className={`${styles.button} bg-green-400`}>Reset Password</button>
                </fieldset>
            </form>
        </article>
    )
}