import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import Doctors from './pages/Doctors'
import Appointments from './pages/Appointments'
import Emergency from './pages/Emergency'
import Blood from './pages/Blood'
import Reminders from './pages/Reminders'
import Hospitals from './pages/Hospitals'

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Navbar />
          <div className="app-main">
            <Header />
            <main className="app-viewport">
              <div className="app-content-container">
                <Routes>
                  <Route path="/"             element={<Dashboard />} />
                  <Route path="/patients"     element={<Patients />} />
                  <Route path="/doctors"      element={<Doctors />} />
                  <Route path="/appointments" element={<Appointments />} />
                  <Route path="/reminders"    element={<Reminders />} />
                  <Route path="/emergency"    element={<Emergency />} />
                  <Route path="/blood"        element={<Blood />} />
                  <Route path="/hospitals"    element={<Hospitals />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}
