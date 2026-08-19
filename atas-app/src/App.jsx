import { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { useLocation } from 'react-router-dom';

// Page(s) Imports
import Login from './pages/login/Login';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/task/Tasklist';
import Tasks from './pages/task/Tasks';
import Timetable from './pages/Timetable';
import Team from './pages/Team';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPass from './pages/ForgotPass';
import Aichat from './component/AIchat';

// Layout Imports
import Layout from './layout/Layout';
import { TaskEditorProvider } from './context/TaskEditorContext';
import axios from 'axios';
axios.defaults.withCredentials = true;
function App() {
  const [count, setCount] = useState(0)
  const location = useLocation()

  return (
    <TaskEditorProvider>
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
        <Route path='/forgot-pass' element={<ForgotPass />} />

        <Route element={<Layout />}>
          <Route path='/dashboard' element={<Dashboard />} />
          <Route path="/task" element={<TaskList />} />
          <Route path="/task/:taskId" element={<Tasks />} />
          <Route path='/timetable' element={<Timetable />} />
          <Route path='/team' element={<Team />} />
        </Route>
      </Routes>

      {location.pathname.includes('/task') ? <Aichat /> : null}
    </TaskEditorProvider>
  )
}

export default App
