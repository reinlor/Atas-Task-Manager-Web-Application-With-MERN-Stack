import { ClockIcon } from "../component/Icons";

export default function Timetable() {
    return (
        <div className="flex flex-col items-center justify-center text-center py-24 max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-full bg-input border border-divider flex items-center justify-center mb-4">
                <ClockIcon className="w-5 h-5 text-accent-color" />
            </div>
            <h2 className="text-primary font-medium">Nothing scheduled</h2>
            <p className="text-secondary text-sm mt-1">
                Tasks with due dates will line up here on a timeline.
            </p>
        </div>
    );
}