import { useState } from "react";
import Modal from "../component/Modal";

function Dashboard() {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            This is the dashboard
            <Modal
                message='Testing Lang Po'
                display={showModal}
                buttonContent={{ 'Confirm': () => setShowModal(false) }}
            />
            
            <button
                onClick={() => setShowModal(true)}
            >
                Click Me to show
            </button>
        </>
    );
}

export default Dashboard;