const styles = {
    card: "flex flex-col justify-center rounded-sm border-2 w-120 p-3",
    button: "text-center w-full p-1 border-3 rounded-sm mb-4 cursor-pointer",
    input: "border-3 rounded-sm p-1 w-full"
};

import Button from "../../component/Button";
import TextInput from "../../component/TextInput";

export default function ForgotForm({ changeForm, buttonState, handleForgotPassword, onChange, formData }) {
    const { email } = formData
    const handlePasswordChange = async () => {
        try {
            setButtonLoading(true)
            const response = await axios(
                `${import.meta.env.VITE_API_BASE_URL}/api/new-pass`, {
                token: token,
                newPassword: newPass,
                confirmPassword: confirmPasss
            })
        } catch (error) {
            setMessage(error?.response?.data?.message)
        } finally {
            setButtonLoading(false)
        }
    }

    return (
        <article className={styles.card}>
            <h1>Password Reset</h1>
            <form>
                <fieldset>
                    <legend>Reset password will be sent on your registered email</legend>

                    <div className="flex flex-col">
                        <label>Email</label>
                        <TextInput
                            type="email"
                            name="email"
                            value={email}
                            onChange={onChange}
                            placeholder="email@sample.com" />
                    </div>
                    <button
                        type="button"
                        onClick={() => changeForm('login')}
                        className="underline text-gray-600 cursor-pointer pb-4 text-sm">Login Page</button>

                    <Button
                        isLoading={buttonState}
                        onClick={handleForgotPassword}
                        cstyle={'w-full'}
                    >Confirm</Button>
                </fieldset>
            </form>
        </article>
    )
}