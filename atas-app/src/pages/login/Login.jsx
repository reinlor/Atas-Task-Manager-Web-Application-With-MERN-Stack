import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios'
import { toast } from 'react-toastify';

import GoogleLoginButton from "../../component/GoogleLoginButton";
import Button from "../../component/Button";
import TextInput from "../../component/TextInput";

import AuthLayout from "./AuthLayout";
import ForgotForm from "./ForgotForm";
import RegisterForm from "./RegisterForm";

// Copy for each screen lives in one place, keyed by the same activeForm value
// that already drives handleFormChange — so title/subtitle can never drift out
// of sync with which form is actually showing.
const SCREEN_COPY = {
    login: { eyebrow: "Sign in", title: "Welcome back", subtitle: "Enter your credentials to continue." },
    register: { eyebrow: "Create account", title: "Join atas", subtitle: "Start planning with your team in minutes." },
    forgot: { eyebrow: "Reset password", title: "Forgot your password?", subtitle: "We'll email you a link to get back in." },
}

export default function Login() {
    const [activeForm, setActiveForm] = useState("login");
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: ''
    })
    const { email, password, username } = formData;
    const [isButtonLoading, setIsButtonLoading] = useState(false)


    // Helpers
    const navigate = useNavigate();
    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            setIsButtonLoading(true)
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/account/login`,
                { email, password },
                { withCredentials: true }
            )

            toast(`Welcome back, ${response.data.username}!`);

            if (response.status === 200) navigate('/dashboard');
        } catch (error) {
            console.error(error.response?.data?.message || 'An error occurred during login.');
            toast.error(error.response?.data?.message || 'An error occurred during login.')
        } finally {
            setIsButtonLoading(false)
        }
    }

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            setIsButtonLoading(true)
            const response = await toast.promise(axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/account/create`,
                { username, email, password },
                { withCredentials: true }
            ), {
                pending: 'Registering your account...',
                success: 'Account Registered successfully! 👌',
                error: {
                    render({ data }) {
                        return data.response?.data?.message || 'Registration failed. Please try again.';
                    }
                }
            });
        } catch (error) {
            console.error(error.response?.data?.message || 'An error occurred during login.');
        } finally {
            setIsButtonLoading(false)
        }
    }

    const handleForgotPassword = async (e) => {
        try {
            setIsButtonLoading(true)
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/account/forgotPass`, { email })
            toast(response?.data?.message)
        } catch (error) {
            toast.error(error?.response?.data?.message)
        } finally {
            setIsButtonLoading(false)
        }
    }

    const switchForm = (nextForm) => {
        setFormData(prev => ({ ...prev, password: '' }))
        setActiveForm(nextForm);
    }

    const copy = SCREEN_COPY[activeForm] ?? SCREEN_COPY.login

    const activeStyles = "opacity-100 scale-100 pointer-events-auto z-10";
    const hiddenStyles = "opacity-0 scale-95 pointer-events-none z-0";

    return (
        <main className="flex justify-center items-center w-full min-h-svh bg-main p-4 md:p-8">
            <AuthLayout eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.subtitle}>
                
                <div className="relative w-full min-h-[380px] grid grid-cols-1 items-start">
                    
                    {/* Login Form */}
                    <div className={`col-start-1 row-start-1 w-full transition-all duration-500 ease-in-out ${activeForm === "login" ? activeStyles : hiddenStyles}`}>
                        <LoginForm
                            handleLogin={handleLogin}
                            changeForm={switchForm}
                            formData={formData}
                            onChange={onChange}
                            buttonState={isButtonLoading}
                        />
                    </div>

                    {/* Register Form */}
                    <div className={`col-start-1 row-start-1 w-full transition-all duration-500 ease-in-out ${activeForm === "register" ? activeStyles : hiddenStyles}`}>
                        <RegisterForm
                            changeForm={switchForm}
                            formData={formData}
                            onChange={onChange}
                            handleRegister={handleRegister}
                            buttonState={isButtonLoading}
                        />
                    </div>

                    {/* Forgot Pass Form */}
                    <div className={`col-start-1 row-start-1 w-full transition-all duration-500 ease-in-out ${activeForm === "forgot" ? activeStyles : hiddenStyles}`}>
                        <ForgotForm
                            changeForm={switchForm}
                            formData={formData}
                            onChange={onChange}
                            handleForgotPassword={handleForgotPassword}
                            buttonState={isButtonLoading}
                        />
                    </div>

                </div>

            </AuthLayout>
        </main>
    );
}

function LoginForm({ handleLogin, changeForm, formData, onChange, buttonState }) {
    const [showPass, setShowPass] = useState(false);
    const { email, password } = formData;

    return (
        <form onSubmit={handleLogin}>
            <fieldset>
                {/* Not visually presented but being read by screen reader 😏 */}
                <legend className="sr-only">Sign in to your account</legend>

                <GoogleLoginButton />

                <div className="flex items-center gap-3 my-6">
                    <div className="h-px flex-1 bg-divider" />
                    <span className="text-[11px] uppercase tracking-widest text-accent-color">or</span>
                    <div className="h-px flex-1 bg-divider" />
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-xs font-medium tracking-wide text-secondary mb-1.5">Email</label>
                        <TextInput
                            type="email" id="email" name="email"
                            value={email}
                            onChange={onChange}
                            placeholder="you@example.com"
                            
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
                            isPassword={!showPass} id="password" name="password"
                            value={password}
                            onChange={onChange}
                        />
                    </div>

                    <div className="flex justify-end -mt-1">
                        <button
                            type="button"
                            onClick={() => changeForm('forgot')}
                            className="text-xs text-accent-color hover:text-brand transition-colors cursor-pointer">
                            Forgot password?
                        </button>
                    </div>

                    <Button
                        onClick={handleLogin}
                        isLoading={buttonState}
                        cstyle="w-full"
                    >Log In</Button>
                </div>

                <p className="text-center text-sm text-secondary mt-6">
                    Don't have an account?{' '}
                    <button
                        type="button"
                        onClick={() => changeForm('register')}
                        className="text-brand hover:brightness-110 font-medium cursor-pointer">
                        Register
                    </button>
                </p>
            </fieldset>
        </form>
    )
}