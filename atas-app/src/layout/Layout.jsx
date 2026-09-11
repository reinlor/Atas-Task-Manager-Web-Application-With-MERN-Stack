import { Outlet } from "react-router-dom";

// Layout
import Header from "./Header";
import Navigation from "./Navigation";
import Footer from "./Footer";

export default function Layout() {
    return (
        <div className="flex h-screen bg-main">
            <Navigation />

            <div className="flex flex-col flex-1 min-w-0">
                <Header />
                
                <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 sm:pb-24 lg:pb-6">
                    <Outlet />
                </main>

                <Footer />
            </div>
        </div>
    );
}