import { useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';

// Page(s) Imports
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Timetable from './pages/Timetable';
import Team from './pages/Team';

// Layout Imports
import Layout from './layout/Layout';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Routes>
        <Route path='/' element={<Login />} />

        <Route element={<Layout/>}>
          <Route path='/dashboard' element={<Dashboard/>} />
          <Route path='/task' element={<Tasks/>} />
          <Route path='/timetable' element={<Timetable/>} />
          <Route path='/team' element={<Team/>} />
        </Route>
      </Routes>
  
    </>
  )
}

export default App
