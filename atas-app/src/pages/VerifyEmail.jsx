import axios from 'axios'
import { useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [isApproved, setIsApproved] = useState(false);
    const [message, setMessage] = useState('')

    const token = searchParams.get('token')
    if (!token)
        return

    useEffect(() => {
        const verifyEmail = async () => {
            setIsLoading(true)
            try {
                const post = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/account/verify`,
                    { token: token }
                )
                setIsApproved(true)
            } catch (error) {
                setMessage(error?.response?.data?.message)
            }
            finally {
                setIsLoading(false)
            }
        }
        verifyEmail();
    }, [])

    if (isLoading)
        return <p>Loading...</p>

    if (!isApproved)
        return <p>{message ||
            "Email Verification Unsuccessful! Close this window and try to login again to create a new verification link"}</p>


    return (
        <>
            <p>Email Verified Successfully! You may close this window</p> :
        </>
    )
}