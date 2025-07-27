import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

function FacultyProfile() {
  const { currentUser, getUserData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    department: '',
    designation: '',
    specialization: '',
    experience: '',
    qualifications: '',
    bio: '',
    contactEmail: '',
    officeHours: '',
    profilePictureURL: '',
    institution: ''
  });

  const [profilePicture, setProfilePicture] = useState(null);

  useEffect(() => {
    async function loadFacultyData() {
      if (!currentUser) return;

      try {
        const userData = await getUserData(currentUser.uid);
        if (userData) {
          setFormData(prevData => ({
            ...prevData,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            department: userData.department || '',
            designation: userData.designation || '',
            specialization: userData.specialization || '',
            experience: userData.experience || '',
            qualifications: userData.qualifications || '',
            bio: userData.bio || '',
            contactEmail: userData.contactEmail || currentUser.email,
            officeHours: userData.officeHours || '',
            profilePictureURL: userData.profilePictureURL || ''
          }));
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading faculty data:', error);
        setError('Failed to load profile data');
        setLoading(false);
      }
    }

    loadFacultyData();
  }, [currentUser, getUserData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfilePictureChange = (e) => {
    if (e.target.files[0]) {
      setProfilePicture(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      let newProfilePictureURL = formData.profilePictureURL;

      // Upload new profile picture if selected
      if (profilePicture) {
        const fileRef = ref(storage, `faculty-profiles/${currentUser.uid}/${profilePicture.name}`);
        await uploadBytes(fileRef, profilePicture);
        newProfilePictureURL = await getDownloadURL(fileRef);
      }

      // Update user document
      const userRef = doc(db, 'faculty', currentUser.uid);
      await updateDoc(userRef, {
        ...formData,
        profilePictureURL: newProfilePictureURL,
        updatedAt: new Date().toISOString()
      });

      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        navigate('/faculty/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-11/12 md:w-3/4 mx-auto px-4 py-8">
        <p className="text-center">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="w-11/12 md:w-3/4 mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Faculty Profile</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Profile Picture */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2 flex items-center gap-2">
              Profile Picture
              <span className="text-gray-500 font-normal text-xs">(Optional)</span>
            </label>
            <div className="flex items-start gap-4">
              {formData.profilePictureURL ? (
                <div className="flex flex-col items-center">
                  <img
                    src={formData.profilePictureURL}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, profilePictureURL: '' }));
                      setProfilePicture(null);
                    }}
                    className="mt-2 text-red-600 text-sm hover:text-red-700"
                  >
                    Remove photo
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                  <span className="text-gray-400 text-sm">No photo</span>
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:opacity-90"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Recommended: Square image, at least 200x200 pixels
                </p>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">
                First Name*
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                className="input-field"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastName">
                Last Name*
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                className="input-field"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          {/* Department and Designation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="department">
                Department*
              </label>
              <input
                id="department"
                name="department"
                type="text"
                className="input-field"
                value={formData.department}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="designation">
                Designation*
              </label>
              <input
                id="designation"
                name="designation"
                type="text"
                className="input-field"
                value={formData.designation}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          {/* Specialization and Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="specialization">
                Specialization*
              </label>
              <input
                id="specialization"
                name="specialization"
                type="text"
                className="input-field"
                value={formData.specialization}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="experience">
                Years of Experience*
              </label>
              <input
                id="experience"
                name="experience"
                type="number"
                min="0"
                className="input-field"
                value={formData.experience}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          {/* Qualifications */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="qualifications">
              Qualifications*
            </label>
            <textarea
              id="qualifications"
              name="qualifications"
              rows="3"
              className="input-field"
              value={formData.qualifications}
              onChange={handleInputChange}
              placeholder="Ph.D. in Computer Science, M.Tech in Software Engineering..."
              required
            />
          </div>

          {/* Bio */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bio">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows="4"
              className="input-field"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Brief description about your academic background and research interests..."
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contactEmail">
                Contact Email*
              </label>
              <input
                id="contactEmail"
                name="contactEmail"
                type="email"
                className="input-field"
                value={formData.contactEmail}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="officeHours">
                Office Hours
              </label>
              <input
                id="officeHours"
                name="officeHours"
                type="text"
                className="input-field"
                value={formData.officeHours}
                onChange={handleInputChange}
                placeholder="e.g., Mon-Fri 2-4 PM"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FacultyProfile; 