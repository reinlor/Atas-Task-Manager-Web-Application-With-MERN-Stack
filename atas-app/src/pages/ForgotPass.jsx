import { useState } from "react"
import axios from "axios";
import Button from "../component/Button"
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function ForgotPass() {
    const [searchParams] = useSearchParams();
    const [pass, setPass] = useState({
        newPass: '',
        confirmPass: ''
    })
    const [buttonLoading, setButtonLoading] = useState(false)
    const { newPass, confirmPass } = pass;
    const token = searchParams.get('token')

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPass(prev => ({ ...prev, [name]: value }));
    }

    const handlePasswordChange = async () => {
        try {
            setButtonLoading(true)
            console.log("clicked")
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

    return (
        <section className="flex justify-center items-center min-h-screen">
            <div className="w-140">
                <form className="flex flex-col p-2 rounded-2xl border-2 gap-2">
                    <legend className="text-center">Enter Your new Password</legend>

                    <label>New Password</label>
                    <input
                        type="text" name="newPass" className="border-3 rounded-sm p-1 w-full"
                        onChange={handleInputChange} value={newPass} />

                    <label>Confirm Password</label>
                    <input
                        type="text" name="confirmPass" className="border-3 rounded-sm p-1 w-full"
                        onChange={handleInputChange} value={confirmPass} />

                    <Button
                        isLoading={buttonLoading}
                        onClick={handlePasswordChange}
                    >Confirm</Button>
                </form>
            </div>
        </section>
    )
}