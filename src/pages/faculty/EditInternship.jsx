import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import InternshipForm from '../../components/faculty/InternshipForm';

function EditInternship() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [internship, setInternship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchInternship() {
      setLoading(true);
      setError('');
      try {
        const docRef = doc(db, 'internships', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          setError('Internship not found');
          setLoading(false);
          return;
        }
        setInternship({ id: docSnap.id, ...docSnap.data() });
      } catch (err) {
        setError('Failed to fetch internship details.');
      } finally {
        setLoading(false);
      }
    }
    fetchInternship();
  }, [id]);

  const handleEditSuccess = async (updatedData) => {
    try {
      const docRef = doc(db, 'internships', id);
      await updateDoc(docRef, updatedData);
      navigate(`/faculty/internships/${id}`);
    } catch (err) {
      setError('Failed to update internship.');
    }
  };

  if (loading) {
    return <div className="w-11/12 md:w-3/4 mx-auto px-4 py-8"><p>Loading...</p></div>;
  }
  if (error) {
    return <div className="w-11/12 md:w-3/4 mx-auto px-4 py-8"><p className="text-red-600">{error}</p></div>;
  }
  if (!internship) {
    return <div className="w-11/12 md:w-3/4 mx-auto px-4 py-8"><p>Internship not found.</p></div>;
  }

  return (
    <div className="w-11/12 md:w-3/4 mx-auto px-4 py-8">
      <InternshipForm
        initialData={internship}
        editMode={true}
        onSuccess={handleEditSuccess}
        onCancel={() => navigate(`/faculty/internships/${id}`)}
      />
    </div>
  );
}

export default EditInternship; 