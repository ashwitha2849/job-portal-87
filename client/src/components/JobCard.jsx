import { useNavigate } from 'react-router-dom'
const JobCard = ({ job }) => {
  const navigate = useNavigate()
  return (
    <div className='bg-white rounded-3xl p-6 border border-slate-100/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[360px]'>
      <div className="space-y-4">
        {/* Company Logo Header */}
        <div className='flex items-center gap-3'>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2 w-12 h-12 flex items-center justify-center overflow-hidden">
            <img className='max-h-full max-w-full object-contain' src={job.companyId.image} alt="" />
          </div>
          <div>
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{job.companyId.name}</h5>
            <h4 className='font-bold text-base text-slate-800 tracking-tight leading-tight line-clamp-1 mt-0.5'>{job.title}</h4>
          </div>
        </div>
        {/* Badges */}
        <div className='flex items-center flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider'>
          <span className='bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-xl'>
            📍 {job.location}
          </span>
          <span className='bg-rose-50 border border-rose-100 text-rose-700 px-3 py-1 rounded-xl'>
            💼 {job.level}
          </span>
        </div>
        {/* Job Description (Slice and render) */}
        <p 
          className='text-slate-500 text-xs leading-relaxed line-clamp-4 text-justify font-normal font-sans' 
          dangerouslySetInnerHTML={{ __html: job.description }}
        ></p>
      </div>
      {/* Footer Actions */}
      <div className='mt-5 flex items-center gap-3 pt-4 border-t border-slate-50'>
        <button 
          onClick={() => { navigate(`/apply-job/${job._id}`); scrollTo(0, 0) }} 
          className='bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition duration-200 active:scale-95 flex-grow hover:shadow-[0_0_12px_rgba(99,102,241,0.3)]'
        >
          Apply Now
        </button>
        <button 
          onClick={() => { navigate(`/apply-job/${job._id}`); scrollTo(0, 0) }} 
          className='text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition duration-200 active:scale-95'
        >
          Details
        </button>
      </div>
    </div>
  )
}
export default JobCard