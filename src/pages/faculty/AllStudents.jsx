import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid';
import { getStatusLabel } from '../../utils/applicationUtils';

const YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];
const DIVISIONS = ['A', 'B', 'C'];

// This is a new component for a single student row
function StudentRow({ student }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <tr onClick={() => setIsOpen(!isOpen)} className="cursor-pointer hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.tenthPercentage}% / {student.twelfthPercentage}%</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.cgpa}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            student.currentlyPursuingInternship === 'Yes'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {student.currentlyPursuingInternship}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {isOpen ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
        </td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan="5" className="p-0">
            <div className="p-4 bg-gray-100">
              <h4 className="font-bold text-md mb-2">Full Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><strong>Email:</strong> {student.email}</div>
                <div><strong>Passing Year:</strong> {student.passingYear}</div>
                <div><strong>Skills:</strong> {student.skills?.join(', ') || 'N/A'}</div>
                <div><strong>Interests:</strong> {student.interests?.join(', ') || 'N/A'}</div>
                <div className="col-span-2"><strong>Projects:</strong> {student.previousProjects || 'N/A'}</div>
                {student.currentlyPursuingInternship === 'Yes' && (
                  <div className="col-span-2"><strong>Internship:</strong> {student.internshipDetails.companyName} ({student.internshipDetails.duration}, {student.internshipDetails.stipend})</div>
                )}
                <div className="col-span-2 mt-2">
                  <h5 className="font-semibold">Application Status</h5>
                  {student.applications.length > 0 ? (
                     <ul className="list-disc list-inside">
                      {student.applications.map(app => (
                        <li key={app.id}>{app.internshipTitle}: <span className="font-semibold">{getStatusLabel(app)}</span></li>
                      ))}
                    </ul>
                  ) : (
                    'No applications found.'
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function AllStudents() {
  const [allStudents, setAllStudents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [internships, setInternships] = useState({});
  const [quizSubmissions, setQuizSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(YEARS[0]);
  const [selectedDivision, setSelectedDivision] = useState(DIVISIONS[0]);

  useEffect(() => {
    setLoading(true);

    const unsubStudents = onSnapshot(
      collection(db, 'students'),
      (snapshot) => {
        setAllStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false); // Main data loaded
      },
      (err) => {
        console.error("Error fetching students:", err);
        setError('Failed to load student data.');
        setLoading(false);
      }
    );

    const unsubApplications = onSnapshot(
      collection(db, 'applications'),
      (snapshot) => setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      (err) => console.error("Error fetching applications:", err)
    );

    const unsubSubmissions = onSnapshot(
      collection(db, 'quizSubmissions'),
      (snapshot) => setQuizSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      (err) => console.error("Error fetching quiz submissions:", err)
    );

    const unsubInternships = onSnapshot(
      collection(db, 'internships'),
      (snapshot) => {
        const internshipsData = snapshot.docs.reduce((acc, doc) => {
          acc[doc.id] = doc.data().title;
          return acc;
        }, {});
        setInternships(internshipsData);
      },
      (err) => setError('Failed to load internship data.')
    );

    return () => {
      unsubStudents();
      unsubApplications();
      unsubInternships();
      unsubSubmissions();
    };
  }, []);

  const filteredStudents = useMemo(() => {
    const submissionsByApplication = quizSubmissions.reduce((acc, sub) => {
        acc[sub.applicationId] = sub;
        return acc;
    }, {});

    const applicationsByStudent = applications.reduce((acc, app) => {
      if (!acc[app.studentId]) acc[app.studentId] = [];
      const submission = submissionsByApplication[app.id];
      const finalStatus = submission ? submission.status : app.status;

      acc[app.studentId].push({ 
        ...app, 
        status: finalStatus,
        internshipTitle: internships[app.internshipId] || 'Unknown Internship' 
      });
      return acc;
    }, {});

    return allStudents
      .map(student => ({
        ...student,
        applications: applicationsByStudent[student.id] || [],
      }))
      .filter(student => 
        student.currentYear === selectedYear && student.division === selectedDivision
      );
  }, [allStudents, applications, internships, quizSubmissions, selectedYear, selectedDivision]);

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">All Students</h1>

      <div className="bg-white p-4 rounded-lg shadow-md mb-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">Select Year</h2>
          <div className="flex flex-wrap gap-2">
            {YEARS.map(year => (
              <button key={year} onClick={() => setSelectedYear(year)} className={`px-4 py-2 rounded-md text-sm font-medium ${selectedYear === year ? 'bg-primary text-white shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                {year}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2 text-gray-700">Select Division</h2>
          <div className="flex border-b">
            {DIVISIONS.map(division => (
              <button key={division} onClick={() => setSelectedDivision(division)} className={`px-6 py-2 -mb-px text-sm font-medium ${selectedDivision === division ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-primary'}`}>
                Division {division}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        {loading ? (
          <p className="p-6 text-center text-gray-500">Loading students...</p>
        ) : error ? (
          <p className="p-6 text-center text-red-500">{error}</p>
        ) : filteredStudents.length === 0 ? (
          <p className="p-6 text-center text-gray-500">No students found for this selection.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">10th / 12th %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CGPA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interning?</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map(student => (
                <StudentRow key={student.id} student={student} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AllStudents;
