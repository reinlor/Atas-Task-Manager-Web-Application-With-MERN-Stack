const styles = {
    card: "flex flex-col justify-center rounded-sm border-2 w-120 p-3",
    button: "text-center w-full p-1 border-3 rounded-sm mb-4 cursor-pointer",
    input: "border-3 rounded-sm p-1 w-full"
};

import Button from "../../component/Button";

export default function ForgotForm({ changeForm, buttonState }) {
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

                    <Button
                        isLoading={buttonState}
                        cstyle={'w-full'}
                    >Confirm</Button>
                </fieldset>
            </form>
        </article>
    )
}