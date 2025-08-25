import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage, db } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { X } from 'lucide-react';
import { ChevronDown } from 'lucide-react';

// Available options for interests, skills, and departments
const AVAILABLE_INTERESTS = [
  // Mechanical Engineering
  'Design Engineering',
  'Thermal Engineering',
  'Manufacturing & Production',
  'Mechatronics',
  'CAD/CAM & Robotics',
  'Fluid Mechanics & Hydraulics',
  'Automotive Engineering',
  'Aerospace Engineering',
  'Energy Systems & Power Plants',
  'Industrial Engineering',
  
  // Civil Engineering
  'Structural Engineering',
  'Geotechnical Engineering',
  'Transportation Engineering',
  'Environmental Engineering',
  'Construction Management',
  'Water Resources Engineering',
  'Surveying & Geoinformatics',
  'Coastal & Offshore Engineering',
  'Urban Planning & Smart Cities',
  'Earthquake Engineering',
  
  // Computer Science
  'Algorithms & Data Structures',
  'Software Development',
  'Database Systems',
  'Operating Systems',
  'Computer Networks',
  'Cybersecurity',
  'Cloud Computing',
  'Artificial Intelligence',
  'Machine Learning',
  'Data Science',
  'Computer Graphics & AR/VR',
  'Distributed Systems',
  'Theory of Computation',
  
  // Information Technology
  'Web Development',
  'Mobile App Development',
  'Software Engineering',
  'Information Security',
  'Cloud & DevOps',
  'Big Data Analytics',
  'Database Management',
  'IT Infrastructure & Networking',
  'E-commerce & ERP Systems',
  'Human-Computer Interaction',
  
  // Electronics & Communication
  'VLSI Design',
  'Embedded Systems',
  'Digital Signal Processing (DSP)',
  'Control Systems',
  'Communication Systems (Wireless, Optical, Satellite)',
  'Antennas & Microwave Engineering',
  'Internet of Things (IoT)',
  'Robotics & Automation',
  'Nanoelectronics',
  'Power Electronics',
  
  // Artificial Intelligence
  'Machine Learning',
  'Deep Learning',
  'Natural Language Processing (NLP)',
  'Computer Vision',
  'Reinforcement Learning',
  'Neural Networks',
  'AI in Robotics',
  'Explainable AI',
  'AI in Healthcare / Finance / IoT',
  'Data Mining & Knowledge Discovery',
  
  // Electrical Engineering
  'Power Systems',
  'Electrical Machines',
  'Control Systems',
  'Power Electronics & Drives',
  'Renewable Energy Systems',
  'High Voltage Engineering',
  'Smart Grid & Energy Management',
  'Microgrids & Distributed Generation',
  'Instrumentation & Measurement',
  'Electromagnetics'
];

const AVAILABLE_SKILLS = [
  'JavaScript',
  'Python',
  'Java',
  'React',
  'Node.js',
  'Angular',
  'Vue.js',
  'TypeScript',
  'C++',
  'SQL',
  'MongoDB'
];

const AVAILABLE_DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electrical Engineering',
  'Electronics and Telecommunication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Artificial Intelligence',
  
];

const DEPARTMENT_DOMAINS = {
  'Computer Science': [
    'Algorithms & Data Structures',
    'Software Development',
    'Database Systems',
    'Operating Systems',
    'Computer Networks',
    'Cybersecurity',
    'Cloud Computing',
    'Artificial Intelligence',
    'Machine Learning',
    'Data Science',
    'Computer Graphics & AR/VR',
    'Distributed Systems',
    'Theory of Computation'
  ],
  'Information Technology': [
    'Web Development',
    'Mobile App Development',
    'Software Engineering',
    'Information Security',
    'Cloud & DevOps',
    'Big Data Analytics',
    'Database Management',
    'IT Infrastructure & Networking',
    'E-commerce & ERP Systems',
    'Human-Computer Interaction'
  ],
  'Electrical Engineering': [
    'Power Systems',
    'Electrical Machines',
    'Control Systems',
    'Power Electronics & Drives',
    'Renewable Energy Systems',
    'High Voltage Engineering',
    'Smart Grid & Energy Management',
    'Microgrids & Distributed Generation',
    'Instrumentation & Measurement',
    'Electromagnetics'
  ],
  'Electronics and Telecommunication': [
    'VLSI Design',
    'Embedded Systems',
    'Digital Signal Processing (DSP)',
    'Control Systems',
    'Communication Systems (Wireless, Optical, Satellite)',
    'Antennas & Microwave Engineering',
    'Internet of Things (IoT)',
    'Robotics & Automation',
    'Nanoelectronics',
    'Power Electronics'
  ],
  'Mechanical Engineering': [
    'Design Engineering',
    'Thermal Engineering',
    'Manufacturing & Production',
    'Mechatronics',
    'CAD/CAM & Robotics',
    'Fluid Mechanics & Hydraulics',
    'Automotive Engineering',
    'Aerospace Engineering',
    'Energy Systems & Power Plants',
    'Industrial Engineering'
  ],
  'Civil Engineering': [
    'Structural Engineering',
    'Geotechnical Engineering',
    'Transportation Engineering',
    'Environmental Engineering',
    'Construction Management',
    'Water Resources Engineering',
    'Surveying & Geoinformatics',
    'Coastal & Offshore Engineering',
    'Urban Planning & Smart Cities',
    'Earthquake Engineering'
  ],
  'Artificial Intelligence': [
    'Machine Learning',
    'Deep Learning',
    'Natural Language Processing (NLP)',
    'Computer Vision',
    'Reinforcement Learning',
    'Neural Networks',
    'AI in Robotics',
    'Explainable AI',
    'AI in Healthcare / Finance / IoT',
    'Data Mining & Knowledge Discovery'
  ]
};

const initialFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  department: '',
  division: '',
  currentYear: '',
  tenthPercentage: '',
  twelfthPercentage: '',
  internships: [],
  interests: [],
  skills: [],
  cgpa: '',
  passingYear: '',
  certificates: [],
  previousProjects: '',
  resume: null,
  resumeURL: '',
  currentlyPursuingInternship: 'No',
  internshipDetails: {},
  cocubesScore: '',
  githubLink: '',
  linkedinLink: '',
  codechefLink: '',
  codechefRating: '',
  leetcodeLink: '',
  leetcodeRating: '',
  achievementsTechnical: '',
  achievementsPersonal: ''
};

function Profile() {
  const { currentUser, getUserData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profilePictureURL, setProfilePictureURL] = useState('');
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [interestSearch, setInterestSearch] = useState('');
  const [skillSearch, setSkillSearch] = useState('');
  const [showInterestsDropdown, setShowInterestsDropdown] = useState(false);
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);
  const fileInputRef = useRef(null);
  const interestsDropdownRef = useRef(null);
  const skillsDropdownRef = useRef(null);
  const interestsArrowRef = useRef(null);
  const skillsArrowRef = useRef(null);

  // Fetch initial user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (currentUser) {
        try {
          setLoading(true);
          const userData = await getUserData(currentUser.uid);
          if (userData) {
            setFormData(prev => ({
              ...prev,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              email: userData.email || '',
              phoneNumber: userData.phoneNumber || '',
              department: userData.department || '',
              division: userData.division || '',
              currentYear: userData.currentYear || '',
              tenthPercentage: userData.tenthPercentage || '',
              twelfthPercentage: userData.twelfthPercentage || '',
              internships: userData.internships || [],
              interests: userData.interests || [],
              skills: userData.skills || [],
              cgpa: userData.cgpa || '',
              passingYear: userData.passingYear || '',
              certificates: userData.certificates || [],
              previousProjects: userData.previousProjects || '',
              currentlyPursuingInternship: userData.currentlyPursuingInternship || 'No',
              internshipDetails: userData.internshipDetails || {},
              cocubesScore: userData.cocubesScore || '',
              githubLink: userData.githubLink || '',
              linkedinLink: userData.linkedinLink || '',
              codechefLink: userData.codechefLink || '',
              codechefRating: userData.codechefRating || '',
              leetcodeLink: userData.leetcodeLink || '',
              leetcodeRating: userData.leetcodeRating || '',
              achievementsTechnical: userData.achievementsTechnical || '',
              achievementsPersonal: userData.achievementsPersonal || ''
            }));
            if (userData.profilePictureURL) {
              setProfilePictureURL(userData.profilePictureURL);
            }
          }
        } catch (err) {
          setError('Failed to load user data');
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [currentUser, getUserData]);

  // Handle clicks outside dropdowns to close them
  useEffect(() => {
    function handleClickOutside(event) {
      // For interests dropdown
      if (interestsDropdownRef.current && !interestsDropdownRef.current.contains(event.target) && 
          (!interestsArrowRef.current || !interestsArrowRef.current.contains(event.target))) {
        setShowInterestsDropdown(false);
      }
      
      // For skills dropdown
      if (skillsDropdownRef.current && !skillsDropdownRef.current.contains(event.target) &&
          (!skillsArrowRef.current || !skillsArrowRef.current.contains(event.target))) {
        setShowSkillsDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('internshipDetails.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        internshipDetails: {
          ...prev.internshipDetails,
          [key]: value
        }
      }));
    } else if (name === 'phoneNumber') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, phoneNumber: digitsOnly }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleInterestSelect = (interest) => {
    if (!formData.interests.includes(interest)) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interest]
      }));
    }
    setInterestSearch('');
    setShowInterestsDropdown(false);
  };

  const handleSkillSelect = (skill) => {
    if (!formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
    setSkillSearch('');
    setShowSkillsDropdown(false);
  };

  // Add custom skill when pressing Enter
  const handleSkillInputKeyDown = (e) => {
    if (e.key === 'Enter' && skillSearch.trim()) {
      e.preventDefault();
      const newSkill = skillSearch.trim();
      if (!formData.skills.includes(newSkill)) {
        setFormData(prev => ({
          ...prev,
          skills: [...prev.skills, newSkill]
        }));
      }
      setSkillSearch('');
      setShowSkillsDropdown(false);
    }
  };

  // Add custom interest when pressing Enter
  const handleInterestInputKeyDown = (e) => {
    if (e.key === 'Enter' && interestSearch.trim()) {
      e.preventDefault();
      const newInterest = interestSearch.trim();
      if (!formData.interests.includes(newInterest)) {
        setFormData(prev => ({
          ...prev,
          interests: [...prev.interests, newInterest]
        }));
      }
      setInterestSearch('');
      setShowInterestsDropdown(false);
    }
  };

  const handleRemoveInterest = (interestToRemove) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(interest => interest !== interestToRemove)
    }));
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  // Filter options based on search
  const allInterests = AVAILABLE_INTERESTS;

  const prioritizedInterests = useMemo(() => {
    const dept = formData.department;
    if (!dept || !DEPARTMENT_DOMAINS[dept]) return allInterests;

    const preferred = new Set(DEPARTMENT_DOMAINS[dept]);
    const preferredList = allInterests.filter(i => preferred.has(i));
    const othersList = allInterests.filter(i => !preferred.has(i));
    return [...preferredList, ...othersList];
  }, [formData.department]);

  const filteredInterests = prioritizedInterests.filter(interest =>
    interest.toLowerCase().includes(interestSearch.toLowerCase()) &&
    !formData.interests.includes(interest)
  );

  const filteredSkills = AVAILABLE_SKILLS.filter(skill =>
    skill.toLowerCase().includes(skillSearch.toLowerCase()) &&
    !formData.skills.includes(skill)
  );

  const handleProfilePictureClick = () => {
    fileInputRef.current.click();
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setLoading(true);
        setProfilePictureFile(file); // Store the file for later upload
        
        // Create a preview URL
        const previewUrl = URL.createObjectURL(file);
        setProfilePictureURL(previewUrl);
        setSuccess('Profile picture updated successfully');
      } catch (err) {
        setError('Failed to update profile picture');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        resume: file
      }));
    }
  };

  // Add new state for certificate input
  const [certificateInput, setCertificateInput] = useState({
    title: '',
    link: ''
  });

  // Add new function to handle certificate addition
  const handleAddCertificate = (e) => {
    e.preventDefault();
    if (certificateInput.title && certificateInput.link) {
      setFormData(prev => ({
        ...prev,
        certificates: [...prev.certificates, certificateInput]
      }));
      setCertificateInput({ title: '', link: '' }); // Reset input
    }
  };

  // Add function to remove certificate
  const handleRemoveCertificate = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      certificates: prev.certificates.filter((_, index) => index !== indexToRemove)
    }));
  };

  // Add function to handle certificate input changes
  const handleCertificateInputChange = (e) => {
    const { name, value } = e.target;
    setCertificateInput(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Required field validations
      if (!formData.email) {
        setError('Email is required');
        setLoading(false);
        return;
      }
      const phoneRegex = /^[0-9]{10}$/;
      if (!formData.phoneNumber) {
        setError('Phone number is required');
        setLoading(false);
        return;
      }
      if (!phoneRegex.test(formData.phoneNumber)) {
        setError('Phone number must be 10 digits');
        setLoading(false);
        return;
      }
      if (formData.tenthPercentage === '' || formData.twelfthPercentage === '' || formData.cgpa === '') {
        setError('10th, 12th percentage and CGPA are required');
        setLoading(false);
        return;
      }
      if (!formData.passingYear) {
        setError('Passing year is required');
        setLoading(false);
        return;
      }
      if (!formData.previousProjects || formData.previousProjects.trim() === '') {
        setError('Previous projects are required');
        setLoading(false);
        return;
      }

      // Links and scores compulsory; allow 'NA' for not applicable
      const mustHave = [
        { key: 'githubLink', label: 'GitHub profile link' },
        { key: 'linkedinLink', label: 'LinkedIn profile link' },
        { key: 'cocubesScore', label: 'CoCubes score' },
        { key: 'leetcodeLink', label: 'LeetCode profile link' },
        { key: 'codechefLink', label: 'CodeChef profile link' }
      ];
      for (const { key, label } of mustHave) {
        const val = (formData[key] ?? '').toString().trim();
        if (val === '') {
          setError(`${label} is required (enter 'NA' if not applicable)`);
          setLoading(false);
          return;
        }
      }

      // Certificates: if any certificate exists, require link; otherwise allow empty array or 'NA' single item
      const certs = formData.certificates || [];
      for (const cert of certs) {
        const linkVal = (cert.link ?? '').toString().trim();
        if (linkVal === '') {
          setError('Certificate link is required (enter \"NA\" if not applicable)');
          setLoading(false);
          return;
        }
      }

      // Upload resume if selected
      let resumeURL = formData.resumeURL || null; // Keep existing URL if no new file
      if (formData.resume) {
        const storageRef = ref(storage, `resumes/${currentUser.uid}/${formData.resume.name}`);
        await uploadBytes(storageRef, formData.resume);
        resumeURL = await getDownloadURL(storageRef);
      }

      // Upload profile picture if selected
      let newProfilePictureURL = profilePictureURL; // Keep existing URL if no new file
      if (profilePictureFile) {
        const storageRef = ref(storage, `profile-pictures/${currentUser.uid}`);
        await uploadBytes(storageRef, profilePictureFile);
        newProfilePictureURL = await getDownloadURL(storageRef);
      }

      // Update user profile in Firestore
      const userRef = doc(db, 'students', currentUser.uid);
      await updateDoc(userRef, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        department: formData.department,
        division: formData.division,
        currentYear: formData.currentYear,
        tenthPercentage: formData.tenthPercentage,
        twelfthPercentage: formData.twelfthPercentage,
        currentlyPursuingInternship: formData.currentlyPursuingInternship || 'No',
        internshipDetails: formData.internshipDetails || {},
        interests: formData.interests,
        skills: formData.skills,
        cgpa: formData.cgpa,
        passingYear: formData.passingYear,
        certificates: formData.certificates,
        previousProjects: formData.previousProjects,
        cocubesScore: formData.cocubesScore,
        githubLink: formData.githubLink,
        linkedinLink: formData.linkedinLink,
        codechefLink: formData.codechefLink,
        codechefRating: formData.codechefRating,
        leetcodeLink: formData.leetcodeLink,
        leetcodeRating: formData.leetcodeRating,
        achievementsTechnical: formData.achievementsTechnical,
        achievementsPersonal: formData.achievementsPersonal,
        resumeURL: resumeURL, // Can be null
        profilePictureURL: newProfilePictureURL || null, // Use null instead of empty string
        profileCompleted: true // Mark profile as completed
      });

      setSuccess('Profile updated successfully');
      
      // Redirect to home page after a short delay
      setTimeout(() => {
        window.location.href = '/home';
      }, 1000);
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center mb-8">
            <div 
              className="w-32 h-32 rounded-full bg-gray-200 mb-4 overflow-hidden cursor-pointer"
              onClick={handleProfilePictureClick}
            >
              {profilePictureURL ? (
                <img 
                  src={profilePictureURL} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-300">
                  <span className="text-gray-600 text-4xl">
                    {formData.firstName && formData.firstName[0]}
                    {formData.lastName && formData.lastName[0]}
                  </span>
                </div>
              )}
            </div>
            <button 
              onClick={handleProfilePictureClick}
              className="mt-2 text-sm text-gray-600 hover:text-primary"
            >
              Change Profile Picture (Optional)
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleProfilePictureChange}
            />
          </div>

          {/* Alert Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="First Name"
                className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-primary"
              />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Last Name"
                className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-primary"
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                readOnly
                required
                className="w-full px-4 py-2 rounded border border-gray-300 bg-gray-100 focus:outline-none"
              />
            </div>

            {/* Phone Number Field */}
            <div>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Enter 10-digit phone number"
                required
                pattern="^[0-9]{10}$"
                title="Enter a valid 10-digit phone number"
                className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-primary"
              />
            </div>

            {/* Department and Division Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-primary appearance-none"
                  required
                >
                  <option value="" disabled>Select Department</option>
                  {AVAILABLE_DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                  <ChevronDown size={16} />
                </div>
              </div>
              <input
                type="text"
                name="division"
                value={formData.division}
                onChange={handleInputChange}
                placeholder="Division (e.g., A, B)"
                className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-primary"
              />
            </div>

            {/* Interests and Skills Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Interests */}
              <div className="relative" ref={interestsDropdownRef}>
                <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded min-h-[42px]">
                  {formData.interests.map(interest => (
                    <span 
                      key={interest}
                      className="inline-flex items-center bg-primary bg-opacity-10 text-primary px-2 py-1 rounded"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(interest)}
                        className="ml-1 text-primary hover:text-primary-dark"
                      >   
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={interestSearch}
                    onChange={(e) => {
                      setInterestSearch(e.target.value);
                      setShowInterestsDropdown(true);
                    }}
                    onFocus={() => setShowInterestsDropdown(true)}
                    onKeyDown={handleInterestInputKeyDown}
                    placeholder={formData.interests.length === 0 ? "Select or type interests" : ""}
                    className="border-0 outline-none flex-grow min-w-[100px]"
                  />
                  <div 
                    ref={interestsArrowRef}
                    onClick={() => setShowInterestsDropdown(!showInterestsDropdown)} 
                    className="cursor-pointer"
                  >
                    <ChevronDown />
                  </div>
                </div>
                {showInterestsDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
                    {interestSearch && !AVAILABLE_INTERESTS.some(i => i.toLowerCase() === interestSearch.toLowerCase()) && (
                      <button
                        type="button"
                        onClick={() => handleInterestSelect(interestSearch)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 font-semibold"
                      >
                        Add "{interestSearch}"
                      </button>
                    )}
                    {filteredInterests.length > 0 ? (
                      filteredInterests.map(interest => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => handleInterestSelect(interest)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100"
                        >
                          {interest}
                        </button>
                      ))
                    ) : (
                      interestSearch && <div className="px-4 py-2 text-gray-500">No matching interests</div>
                    )}
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className="relative" ref={skillsDropdownRef}>
                <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded min-h-[42px]">
                  {formData.skills.map(skill => (
                    <span 
                      key={skill}
                      className="inline-flex items-center bg-primary bg-opacity-10 text-primary px-2 py-1 rounded"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-1 text-primary hover:text-primary-dark"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={skillSearch}
                    onChange={(e) => {
                      setSkillSearch(e.target.value);
                      setShowSkillsDropdown(true);
                    }}
                    onFocus={() => setShowSkillsDropdown(true)}
                    onKeyDown={handleSkillInputKeyDown}
                    placeholder={formData.skills.length === 0 ? "Select or type skills" : ""}
                    className="border-0 outline-none flex-grow min-w-[100px]"
                  />
                  <div 
                    ref={skillsArrowRef}
                    onClick={() => setShowSkillsDropdown(!showSkillsDropdown)} 
                    className="cursor-pointer"
                  >
                    <ChevronDown />
                  </div>
                </div>
                {showSkillsDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
                    {skillSearch && !AVAILABLE_SKILLS.some(s => s.toLowerCase() === skillSearch.toLowerCase()) && (
                      <button
                        type="button"
                        onClick={() => handleSkillSelect(skillSearch)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 font-semibold"
                      >
                        Add "{skillSearch}"
                      </button>
                    )}
                    {filteredSkills.length > 0 ? (
                      filteredSkills.map(skill => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => handleSkillSelect(skill)}
                          className="w-full px-4 py-2 text-left hover:bg-gray-100"
                        >
                          {skill}
                        </button>
                      ))
                    ) : (
                      skillSearch && <div className="px-4 py-2 text-gray-500">No matching skills</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Education Percentage Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                step="any"
                name="tenthPercentage"
                value={formData.tenthPercentage}
                onChange={handleInputChange}
                placeholder="10th Percentage"
                min="0"
                max="100"
                required
                className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-primary no-number-wheel"
                onWheel={(e) => e.currentTarget.blur()}
              />
              <input
                type="number"
                step="any"
                name="twelfthPercentage"
                value={formData.twelfthPercentage}
                onChange={handleInputChange}
                placeholder="12th Percentage"
                min="0"
                max="100"
                required
                className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-primary no-number-wheel"
                onWheel={(e) => e.currentTarget.blur()}
              />
            </div>

            {/* Current Year, Passing Year, and CGPA Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <select
                  name="currentYear"
                  value={formData.currentYear}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-primary appearance-none"
                  required
                >
                  <option value="" disabled>Select Current Year</option>
                  <option value="First Year">First Year</option>
                  <option value="Second Year">Second Year</option>
                  <option value="Third Year">Third Year</option>
                  <option value="Fourth Year">Fourth Year</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                  <ChevronDown size={16} />
                </div>
              </div>
              <div className="relative">
                <input
                  type="text"
                  name="passingYear"
                  value={formData.passingYear}
                  onChange={handleInputChange}
                  placeholder="Passing Year"
                  required
                  className="w-full px-4 py-2 pr-8 rounded border border-gray-300 focus:outline-none focus:border-primary"
                  readOnly
                />
                <div className="absolute right-1 top-0 h-full flex flex-col">
                  <button
                    type="button"
                    onClick={() => {
                      const currentYear = parseInt(formData.passingYear) || new Date().getFullYear();
                      if (currentYear < 2099) {
                        handleInputChange({ target: { name: 'passingYear', value: (currentYear + 1).toString() } });
                      }
                    }}
                    className="flex-1 px-1 hover:bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors text-xs"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const currentYear = parseInt(formData.passingYear) || new Date().getFullYear();
                      if (currentYear > 2024) {
                        handleInputChange({ target: { name: 'passingYear', value: (currentYear - 1).toString() } });
                      }
                    }}
                    className="flex-1 px-1 hover:bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors text-xs"
                  >
                    ▼
                  </button>
                </div>
              </div>
              <input
                type="number"
                name="cgpa"
                value={formData.cgpa}
                onChange={handleInputChange}
                placeholder="CGPA"
                step="0.01"
                min="0"
                max="10"
                required
                className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-primary no-number-wheel"
                onWheel={(e) => e.currentTarget.blur()}
              />
            </div>

            {/* Replace the certificates input with new structure */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <input
                  type="text"
                  name="title"
                  value={certificateInput.title}
                  onChange={handleCertificateInputChange}
                  placeholder="Certificate Title"
                  className="flex-1 px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-primary"
                />
                <input
                  type="url"
                  name="link"
                  value={certificateInput.link}
                  onChange={handleCertificateInputChange}
                  placeholder="Certificate Link"
                  className="flex-1 px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-primary"
                />
                
                <button
                  type="button"
                  onClick={handleAddCertificate}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.certificates.map((cert, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center bg-primary bg-opacity-10 text-primary px-3 py-1.5 rounded"
                  >
                    <a
                      href={cert.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {cert.title}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveCertificate(index)}
                      className="ml-2 text-primary hover:text-primary-dark"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitive Profiles & Achievements */}
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-700">Profiles & Achievements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="number"
                  step="0.01"
                  name="cocubesScore"
                  value={formData.cocubesScore}
                  onChange={handleInputChange}
                  placeholder="CoCubes Score"
                  className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-primary no-number-wheel"
                  onWheel={(e) => e.currentTarget.blur()}
                />
                <input
                  type="url"
                  name="githubLink"
                  value={formData.githubLink}
                  onChange={handleInputChange}
                  placeholder="GitHub Profile Link"
                  className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-primary"
                />
                <input
                  type="url"
                  name="linkedinLink"
                  value={formData.linkedinLink}
                  onChange={handleInputChange}
                  placeholder="LinkedIn Profile Link"
                  className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-primary"
                />
                <input
                  type="url"
                  name="codechefLink"
                  value={formData.codechefLink}
                  onChange={handleInputChange}
                  placeholder="CodeChef Profile Link"
                  className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-primary"
                />
                <input
                  type="number"
                  step="1"
                  min="0"
                  name="codechefRating"
                  value={formData.codechefRating}
                  onChange={handleInputChange}
                  placeholder="CodeChef Rating"
                  className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-primary no-number-wheel"
                  onWheel={(e) => e.currentTarget.blur()}
                />
                <input
                  type="url"
                  name="leetcodeLink"
                  value={formData.leetcodeLink}
                  onChange={handleInputChange}
                  placeholder="LeetCode Profile Link"
                  className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-primary"
                />
                <input
                  type="number"
                  step="1"
                  min="0"
                  name="leetcodeRating"
                  value={formData.leetcodeRating}
                  onChange={handleInputChange}
                  placeholder="LeetCode Rating"
                  className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-primary no-number-wheel"
                  onWheel={(e) => e.currentTarget.blur()}
                />
              </div>
              <textarea
                name="achievementsTechnical"
                value={formData.achievementsTechnical}
                onChange={handleInputChange}
                placeholder="Technical Achievements (e.g., hackathons, contests, publications)"
                rows="3"
                className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-primary resize-none"
              />
              <textarea
                name="achievementsPersonal"
                value={formData.achievementsPersonal}
                onChange={handleInputChange}
                placeholder="Personal Achievements (e.g., leadership roles, community work)"
                rows="3"
                className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <textarea
              name="previousProjects"
              value={formData.previousProjects}
              onChange={handleInputChange}
              placeholder="Previous Projects(With Explanation)"
              rows="4"
              required
              className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:border-primary resize-none"
            />

            {/* Accepted Internships */}
            <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-700">Accepted Internships</h3>
              {formData.internships && formData.internships.length > 0 ? (
                <ul className="space-y-2">
                  {formData.internships.map((internship, index) => (
                    <li key={index} className="p-2 border-b last:border-b-0">
                      <p className="font-semibold">{internship.title} at {internship.companyName}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No accepted internships yet.</p>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => document.getElementById('resume').click()}
                className="bg-primary text-white px-6 py-2 rounded hover:bg-primary-dark transition-colors"
              >
                Upload Resume
              </button>
              <span className="text-gray-600">
                {formData.resume ? formData.resume.name : 'In PDF Format'}
              </span>
              <input
                id="resume"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-auto bg-primary text-white px-8 py-2 rounded hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Details'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;