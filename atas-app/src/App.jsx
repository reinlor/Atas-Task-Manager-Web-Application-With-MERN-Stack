import { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

// Page(s) Imports
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Timetable from './pages/Timetable';
import Team from './pages/Team';
import VerifyEmail from './pages/VerifyEmail';

// Layout Imports
import Layout from './layout/Layout';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick={false}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/verify-email' element={<VerifyEmail />} />

        <Route element={<Layout />}>
          <Route path='/dashboard' element={<Dashboard />} />
          <Route path='/task' element={<Tasks />} />
          <Route path='/timetable' element={<Timetable />} />
          <Route path='/team' element={<Team />} />
        </Route>
      </Routes>

    </>
  )
}

export default App
