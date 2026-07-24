import { useNavigate } from "react-router-dom";

function Navigation() {
    const navigate = useNavigate();

    return (
        <nav className="min-h-full bg-green-200 relative">
            <ul className="flex flex-col">
                <li
                    className="cursor-pointer hover:bg-green-500 p-2"
                    onClick={() => navigate('/dashboard')}>Dashboard</li>
                <li
                    className="cursor-pointer hover:bg-green-500 p-2"
                    onClick={() => navigate('/task')}>Task</li>
                <li
                    className="cursor-pointer hover:bg-green-500 p-2"
                    onClick={() => navigate('/timetable')}>Timetable</li>
                <li
                    className="cursor-pointer hover:bg-green-500 p-2"
                    onClick={() => navigate('/team')}>Team</li>
            </ul>
            <button
                className="absolute w-full bottom-2 p-2 cursor-pointer hover:bg-green-500 p-2"
                onClick={() => navigate('/')}>Log Out</button>
        </nav>
    )
}

export default Navigation;