import { Outlet } from "react-router-dom";

// Layout
import Header from './Header';
import Navigation from './Navigation';
import Footer from './Footer';

export default function Layout() {
    return (
        <div className="grid min-h-screen grid-cols-[200px_1fr] grid-rows-[auto_1fr_auto]">
            <div className="col-span-2">
                <Header />
            </div>

            <div>
                <Navigation />
            </div>

            <div className="flex flex-col">
                <main className="flex-grow">
                    <Outlet />
                </main>
                <div>
                    <Footer />
                </div>
            </div>
        </div>
    );
}