import { useContext, lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
const ResumeAnalyser = lazy(() => import('./pages/ResumeAnalyser'))
import ApplyJob from './pages/ApplyJob'
import Applications from './pages/Applications'
import ResumeBuilder from './pages/ResumeBuilder'
import RecruiterLogin from './components/RecruiterLogin'
import { AppContext } from './context/AppContext'
import Dashboard from './pages/Dashboard'
import AddJob from './pages/AddJob'
import ManageJobs from './pages/ManageJobs'
import ViewApplications from './pages/ViewApplications'
import CompanyProfile from './pages/CompanyProfile'
import 'quill/dist/quill.snow.css'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
const App = () => {
  const { showRecruiterLogin, companyToken } = useContext(AppContext)
  return (
    <div>
      {showRecruiterLogin && <RecruiterLogin />}
      <ToastContainer />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/apply-job/:id' element={<ApplyJob />} />
        <Route path='/applications' element={<Applications />} />
        <Route path='/resume-builder' element={<ResumeBuilder />} />
        <Route path='/resume-analyser' element={<Suspense fallback={<div style={{color:'white',textAlign:'center',padding:'4rem',background:'#0a0a0f',minHeight:'100vh'}}>⚡ Loading AI Analyser...</div>}><ResumeAnalyser /></Suspense>} />
        <Route path='/dashboard' element={<Dashboard />}>
          {
            companyToken ? <>
              <Route path='add-job' element={<AddJob />} />
              <Route path='manage-jobs' element={<ManageJobs />} />
              <Route path='view-applications' element={<ViewApplications />} />
              <Route path='profile' element={<CompanyProfile />} />
            </> : null
          }
        </Route>
      </Routes>
    </div>
  )
}
export default App

