import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios'
import { toast } from 'react-toastify';

import GoogleLoginButton from "../../component/GoogleLoginButton";
import Button from "../../component/Button";
import TextInput from "../../component/TextInput";

import ForgotForm from "./ForgotForm";
import RegisterForm from "./RegisterForm";

const styles = {
    card: "flex flex-col justify-center rounded-sm border-2 w-120 p-3",
    button: "text-center w-full p-1 border-3 rounded-sm mb-4 cursor-pointer",
    input: "border-3 rounded-sm p-1 w-full"
};

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
    const navigate = useNavigate('/');
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
            toast(error.response?.data?.message)
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
            console.log("clicked")
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

    const handleFormChange = () => {
        switch (activeForm) {
            case "login":
                return <LoginForm
                    handleLogin={handleLogin}
                    changeForm={switchForm}
                    formData={formData}
                    onChange={onChange}
                    buttonState={isButtonLoading}
                />
            case "register":
                return <RegisterForm
                    changeForm={switchForm}
                    formData={formData}
                    onChange={onChange}
                    handleRegister={handleRegister}
                    buttonState={isButtonLoading}
                />
            case "forgot":
                return <ForgotForm
                    changeForm={switchForm}
                    formData={formData}
                    onChange={onChange}
                    handleForgotPassword={handleForgotPassword}
                    buttonState={isButtonLoading}
                />
            default:
                return <LoginForm
                    handleLogin={handleLogin}
                    changeForm={switchForm}
                    formData={formData}
                    onChange={onChange}
                    buttonState={isButtonLoading}
                />
        }
    }

    const switchForm = (nextForm) => {
        setFormData(prev => ({ ...prev, password: '' }))
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

function LoginForm({ handleLogin, changeForm, formData, onChange, buttonState }) {
    const [showPass, setShowPass] = useState(false);
    const { email, password } = formData;
    const [isLoading, setIsLoading] = useState(false)

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
                        <TextInput
                            type="text" id="email" name="email"
                            value={email}
                            onChange={onChange}
                        />
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
                        <TextInput
                            isPassword={showPass} name="password"
                            value={password}
                            className={styles.input}
                            onChange={onChange}
                        />
                    </div>

                    {/* Forgot Password */}
                    <div>
                        <button
                            type="button"
                            onClick={() => changeForm('forgot')}
                            className="underline text-gray-500 text-sm cursor-pointer">Forgot Password</button>
                    </div>

                    {/* Login Button */}
                    <Button
                        onClick={handleLogin}
                        isLoading={buttonState}
                        cstyle={'w-full'}
                    >Log In</Button>

                    {/* Register Button */}
                    <p className="text-center">
                        Don't have an account? &nbsp;
                        <button
                            type="button"
                            onClick={() => {
                                changeForm('register')
                            }}
                            className="text-green-500 cursor-pointer">Register</button>
                    </p>
                </fieldset>
            </form>
        </article>
    )
}