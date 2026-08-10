import { useState } from "react";
import Modal from "../component/Modal";

function Dashboard() {
    const [showModal, setShowModal] = useState(false);

    return (
        <div>
            <p className="text-secondary text-sm">Welcome back. Here's what's happening across your boards.</p>

            <Modal
                message="Testing Lang Po"
                display={showModal}
                buttonContent={{ Confirm: () => setShowModal(false) }}
            />

            <button
                onClick={() => setShowModal(true)}
                className="mt-6 inline-flex items-center gap-2 bg-brand text-main text-sm font-semibold rounded-lg px-4 py-2.5 hover:brightness-110 active:brightness-95 transition cursor-pointer"
            >
                Click me to show
            </button>
        </div>
    );
}

export default Dashboard;