import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify'

export default function GoogleLoginButton() {
    const navigate = useNavigate();

    const handleSuccess = async (credentialResponse) => {
        try {
            const idToken = credentialResponse.credential;
            console.log
            const response = await axios.post(
                'http://localhost:3000/api/account/auth/google',
                { idToken },
                { withCredentials: true }
            );
            
            toast(`Welcome, ${response.data.username}!`);
            if (response.status === 200) navigate('/dashboard');
        } catch (error) {
            console.error('Login Failed:', error.response?.data || error.message);
            toast('Server Error')
        }
    };

    return (
        <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.log('Google Sign-In Cancelled/Failed')}
        />
    );
};