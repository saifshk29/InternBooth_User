import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, XCircle } from 'lucide-react';

function Applications() {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const applicationsQuery = query(
          collection(db, 'applications'),
          where('studentId', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(applicationsQuery);
        const applicationsData = [];

        for (const docSnapshot of querySnapshot.docs) {
          const application = docSnapshot.data();
          // Get internship details
          const internshipRef = doc(db, 'internships', application.internshipId);
          const internshipDoc = await getDoc(internshipRef);
          const internshipData = internshipDoc.data();

          applicationsData.push({
            id: doc.id,
            ...application,
            internship: {
              id: internshipDoc.id,
              ...internshipData
            }
          });
        }

        setApplications(applicationsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Failed to load applications');
        setLoading(false);
      }
    };

    fetchApplications();
  }, [currentUser]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Application Under Review';
      case 'accepted':
        return 'Application Accepted';
      case 'rejected':
        return 'Application Rejected';
      default:
        return 'Status Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Applications</h1>

      {applications.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">You haven't applied to any internships yet.</p>
          <Link
            to="/internships"
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Browse Internships
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {applications.map((application) => (
            <div
              key={application.id}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    {application.internship.title}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {application.internship.company}
                  </p>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>Applied on: {new Date(application.appliedAt.toDate()).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(application.status)}
                  <span className="text-sm font-medium">
                    {getStatusText(application.status)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex space-x-4">
                  <Link
                    to={`/internships/${application.internshipId}`}
                    className="text-primary hover:text-primary/90 text-sm font-medium"
                  >
                    View Internship
                  </Link>
                  {application.status === 'accepted' && (
                    <Link
                      to={`/internships/round2-form/${application.id}`}
                      className="text-green-600 hover:text-green-700 text-sm font-medium"
                    >
                      Complete Next Steps
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Applications;
