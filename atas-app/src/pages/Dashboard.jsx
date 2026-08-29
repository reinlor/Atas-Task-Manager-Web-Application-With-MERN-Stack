import { useState } from "react";
import Modal from "../component/Modal";
import Button from "../component/Button";
import TaskModal from "../component/TaskModal";

function Dashboard() {
    const [showModal, setShowModal] = useState(false);
    const [showTaskModal, setTaskShowModal] = useState(false);

    return (
        <div>
            <p className="text-secondary text-sm">Welcome back. Here's what's happening across your boards.</p>
            
            {/* TODO: Modal testing, these will be changed after I completed the other pages */}
            <Modal
                title="Test"
                content="Testing Lang"
                display={showModal}
                onConfirm={() => alert("Confirm Button Clicked")}
                onCancel={() => setShowModal(false)}
            />

            <TaskModal
                display={showTaskModal}
            />

            <Button
                onClick={() => setShowModal(true)}
            >
                Click me to show Modal
            </Button>

            <Button
                onClick={() => setTaskShowModal(true)}
            >
                Click me to show Task Modal
            </Button>
        </div>
    );
}

export default Dashboard;