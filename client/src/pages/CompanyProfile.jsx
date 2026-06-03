import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import { toast } from 'react-toastify';

const CompanyProfile = () => {
    const { backendUrl, companyToken, companyData, fetchCompanyData } = useContext(AppContext);
    
    const [name, setName] = useState('');
    const [image, setImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (companyData) {
            setName(companyData.name || '');
            setPreviewUrl(companyData.image || '');
        }
    }, [companyData]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!name.trim()) {
            toast.error("Company name cannot be empty");
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('name', name);
        if (image) {
            formData.append('image', image);
        }

        try {
            const { data } = await axios.post(
                backendUrl + '/api/company/update-profile',
                formData,
                { headers: { token: companyToken } }
            );

            if (data.success) {
                toast.success(data.message || "Profile updated successfully!");
                setImage(null);
                await fetchCompanyData(); // Refresh global context details
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container p-4 max-w-2xl">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Company Profile</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white p-6 rounded-lg border shadow-sm">
                
                {/* Logo Upload Section */}
                <div className="flex flex-col gap-2">
                    <p className="text-gray-600 font-medium">Company Logo</p>
                    <div className="flex items-center gap-4">
                        <div className="relative w-24 h-24 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-content">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Company Logo" className="w-full h-full object-cover" />
                            ) : (
                                <img src={assets.upload_area} alt="Upload area" className="w-8 h-8 opacity-40 m-auto" />
                            )}
                        </div>
                        
                        <label htmlFor="logo-upload" className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded border text-sm transition-colors duration-200">
                            Change Logo
                            <input 
                                id="logo-upload" 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageChange} 
                                className="hidden" 
                            />
                        </label>
                    </div>
                </div>

                {/* Company Name Section */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="company-name" className="text-gray-600 font-medium">Company Name</label>
                    <input 
                        id="company-name"
                        type="text" 
                        placeholder="Company Name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required 
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded focus:border-blue-500 outline-none transition-colors duration-200"
                    />
                </div>

                {/* Email (Read Only) */}
                <div className="flex flex-col gap-2 opacity-70">
                    <label className="text-gray-600 font-medium">Registered Email Address</label>
                    <input 
                        type="email" 
                        value={companyData?.email || ''} 
                        disabled 
                        className="w-full px-3 py-2 border-2 border-gray-200 bg-gray-50 rounded cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500">Contact support to change your registered email address.</p>
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full sm:w-32 py-3 bg-black text-white font-medium rounded hover:bg-gray-800 disabled:bg-gray-400 transition-colors duration-200"
                >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>

            </form>
        </div>
    );
};

export default CompanyProfile;
