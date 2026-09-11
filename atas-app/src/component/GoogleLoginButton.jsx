import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify'

export default function GoogleLoginButton() {
    const navigate = useNavigate();

    const handleSuccess = async (credentialResponse) => {
        try {
            const idToken = credentialResponse.credential;
            const response = await toast.promise(axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/account/auth/google`,
                { idToken },
                { withCredentials: true }
            ), {
                pending: 'Signing you in with Google...',
                success: {
                    render({ data }) {
                        return `Welcome, ${data.data.username}!`;
                    }
                },
                error: 'Server error. Please try again.'
            });

            if (response.status === 200) navigate('/dashboard');
        } catch (error) {
            console.error('Login Failed:', error.response?.data || error.message);
        }
    };

    return (
        <div className="w-full flex justify-center rounded-lg overflow-hidden [&>div]:w-full [&_iframe]:w-full">
            <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => console.log('Google Sign-In Cancelled/Failed')}
                theme="filled_black"
                shape="rectangular"
                size="large"
                text="continue_with"
                width='100%'
            />
        </div>
    );
};