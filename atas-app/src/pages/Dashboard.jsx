import { useState } from "react";
import Modal from "../component/Modal";
import Button from "../component/Button";

function Dashboard() {
    const [showModal, setShowModal] = useState(false);

    return (
        <div>
            <p className="text-secondary text-sm">Welcome back. Here's what's happening across your boards.</p>

            <Modal
                title="Test"
                content="Testing Lang"
                display={showModal}
                onConfirm={() => alert("Confirm Button Clicked")}
                onCancel={() => setShowModal(false)}
            />

            <Button
                onClick={() => setShowModal(true)}
            >
                Click me to show
            </Button>
        </div>
    );
}

export default Dashboard;