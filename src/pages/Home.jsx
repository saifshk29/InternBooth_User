import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Search } from 'lucide-react';
import InternshipCard from '../components/InternshipCard';

// Domain tag colors mapping
const DOMAIN_COLORS = {
  'VLSI': 'bg-[#EBF5FF] text-[#1E40AF]',
  'Embedded C': 'bg-[#FEE2E2] text-[#991B1B]',
  'Web Development': 'bg-[#DCFCE7] text-[#166534]',
  'Mobile Development': 'bg-[#F3E8FF] text-[#6B21A8]',
  'AI/ML': 'bg-[#FEF9C3] text-[#854D0E]',
  'Data Science': 'bg-[#E0E7FF] text-[#3730A3]',
  'Cloud Computing': 'bg-[#FCE7F3] text-[#9D174D]',
  'DevOps': 'bg-[#FFEDD5] text-[#9A3412]',
  'UI/UX Design': 'bg-[#CCFBF1] text-[#115E59]',
  'Cybersecurity': 'bg-[#FFE4E6] text-[#9F1239]'
};

function Home() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser, getUserData } = useAuth();
  const [userInterests, setUserInterests] = useState([]);
  const [filterByInterests, setFilterByInterests] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [appliedInternshipIds, setAppliedInternshipIds] = useState([]);

  useEffect(() => {
    async function fetchInternships() {
      try {
        setLoading(true);
        setError('');
        
        // Fetch current user's interests if logged in
        if (currentUser) {
          try {
            const userData = await getUserData(currentUser.uid);
            console.log('Raw user data:', userData);
            
            // Check both interestedDomains and interests fields
            const userDomains = userData?.interestedDomains || userData?.interests || [];
            console.log('Extracted user domains:', userDomains);
            
            if (userDomains.length > 0) {
              setUserInterests(userDomains);
              setFilterByInterests(true);
              console.log('User interests set:', userDomains);
            } else {
              console.log('No user interests found');
              setFilterByInterests(false);
            }
          } catch (userError) {
            console.error('Error fetching user data:', userError);
            setError('Error loading user preferences');
            setFilterByInterests(false); // Disable filtering if we can't get user interests
          }
        } else {
          console.log('No current user, showing all internships');
          setFilterByInterests(false);
        }
        
        // Fetch internships
        const internshipsRef = collection(db, 'internships');
        console.log('Fetching internships...');
        
        let internshipsQuery;
        try {
          internshipsQuery = query(internshipsRef, orderBy('postedDate', 'desc'));
          const querySnapshot = await getDocs(internshipsQuery);
          console.log('Raw internships fetched:', querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          
          // Fetch faculty data for each internship
          const internshipsWithFaculty = await Promise.all(
            querySnapshot.docs.map(async (docSnapshot) => {
              try {
                const internshipData = { id: docSnapshot.id, ...docSnapshot.data() };
                console.log('Raw internship data:', internshipData);
                
                // Ensure domains is always an array
                if (!internshipData.domains) {
                  internshipData.domains = [];
                } else if (!Array.isArray(internshipData.domains)) {
                  internshipData.domains = [internshipData.domains];
                }
                
                if (internshipData.facultyId) {
                  const facultyRef = doc(db, 'users', internshipData.facultyId);
                  const facultyDoc = await getDoc(facultyRef);
                  if (facultyDoc.exists()) {
                    internshipData.faculty = facultyDoc.data();
                  } else {
                    console.log('Faculty not found for:', internshipData.facultyId);
                  }
                }
                return internshipData;
              } catch (internshipError) {
                console.error('Error processing internship:', docSnapshot.id, internshipError);
                return null;
              }
            })
          );
          
          // Filter out any null values from failed internship processing
          const validInternships = internshipsWithFaculty.filter(Boolean);
          console.log('Final processed internships:', validInternships);
          
          setInternships(validInternships);
          setLoading(false);
          setError('');
        } catch (queryError) {
          console.error('Error executing internships query:', queryError);
          throw new Error('Failed to fetch internships list');
        }
      } catch (error) {
        console.error('Error in fetchInternships:', error);
        setError(error.message || 'Failed to load internships. Please try again later.');
        setLoading(false);
      }
    }
    
    fetchInternships();
  }, [currentUser, getUserData]);

  useEffect(() => {
    async function fetchAppliedInternships() {
      if (currentUser) {
        try {
          const applicationsQuery = query(
            collection(db, 'applications'),
            where('studentId', '==', currentUser.uid)
          );
          const applicationsSnapshot = await getDocs(applicationsQuery);
          const ids = applicationsSnapshot.docs.map(doc => doc.data().internshipId);
          setAppliedInternshipIds(ids);
        } catch (error) {
          console.error('Error fetching applied internships:', error);
        }
      } else {
        setAppliedInternshipIds([]);
      }
    }
    fetchAppliedInternships();
  }, [currentUser]);

  // Filter internships based on search term, user interests, and applied internships
  const filteredInternships = internships.filter(internship => {
    // Hide internships the student has already applied to
    if (appliedInternshipIds.includes(internship.id)) {
      return false;
    }
    // Debug log for each internship being processed
    console.log('Filtering internship:', {
      id: internship.id,
      title: internship.title,
      domains: internship.domains,
      searchTerm: searchTerm,
      filterByInterests: filterByInterests,
      userInterests: userInterests
    });

    // Search term matching
    const matchesSearch = !searchTerm || // if no search term, show all
      internship.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      internship.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      internship.domains?.some(domain => 
        domain?.toLowerCase().includes(searchTerm.toLowerCase())
      );

    // If not filtering by interests, only apply search filter
    if (!filterByInterests) {
      console.log(`Internship ${internship.id} search match:`, matchesSearch);
      return matchesSearch;
    }

    // If no user interests, show all that match search
    if (!userInterests || userInterests.length === 0) {
      console.log(`No user interests, showing internship ${internship.id} based on search:`, matchesSearch);
      return matchesSearch;
    }

    // If internship has no domains but matches search, show it
    if (!internship.domains || internship.domains.length === 0) {
      console.log(`Internship ${internship.id} has no domains, showing based on search:`, matchesSearch);
      return matchesSearch;
    }

    // Check if any user interest matches any of the internship domains
    const hasMatchingInterest = userInterests.some(interest => {
      const userInterest = interest?.toLowerCase().trim() || '';
      return internship.domains.some(domain => {
        const internshipDomain = domain?.toLowerCase().trim() || '';
        const matches = internshipDomain.includes(userInterest) || userInterest.includes(internshipDomain);
        console.log(`Comparing domain "${internshipDomain}" with interest "${userInterest}":`, matches);
        return matches;
      });
    });

    const shouldShow = matchesSearch && (!filterByInterests || hasMatchingInterest);
    console.log(`Final decision for internship ${internship.id}:`, {
      matchesSearch,
      hasMatchingInterest,
      filterByInterests,
      shouldShow
    });

    return shouldShow;
  });

  // Log final filtered results
  console.log('Final filtered internships:', {
    total: internships.length,
    filtered: filteredInternships.length,
    internships: filteredInternships.map(i => ({
      id: i.id,
      title: i.title,
      domains: i.domains
    }))
  });

  return (
    <div className="min-h-screen flex flex-row bg-white ">
      {/* Search and Filters Section */}
      <div className="w-[25%] bg-background rounded-xl p-5">
          <div className="flex flex-col gap-5">
            <input
              type="text"
              placeholder="Search internships..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {/* <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Domains</option>
              <option value="Web Development">Web Development</option>
              <option value="Mobile Development">Mobile Development</option>
              <option value="Data Science">Data Science</option>
              <option value="Machine Learning">Machine Learning</option>
              <option value="UI/UX Design">UI/UX Design</option>
            </select> */}
          </div>
          
          
        </div>
      <div className="max-w-7xl   bg-white">
      <p className="text-text text-[20px] px-8">
            {filterByInterests && userInterests.length > 0 
              ? `Internship Opportunities Found For You (${filteredInternships.length} Found)`
              : `All Internships (${filteredInternships.length} Found)`}
          </p>
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Internships Grid */}
        {loading ? (
          <div className="text-center py-8">
            <p>Loading internships...</p>
          </div>
        ) : (
          <div className=" p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {filteredInternships.map(internship => (
              <InternshipCard key={internship.id} internship={internship} />
            ))}
          </div>
        )}

        {filteredInternships.length === 0 && !loading && (
          <div className="text-center py-8 ">
            <p className="text-gray-600">No internships found matching your criteria.</p>
            {filterByInterests && (
              <button
                onClick={() => setFilterByInterests(false)}
                className="text-primary hover:underline mt-2"
              >
                Show all internships
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home; 