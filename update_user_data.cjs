const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// --- Data for Randomization ---
const DIVISIONS = ['A', 'B', 'C'];
const YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];
const INTERESTS = ['Web Development', 'Mobile Development', 'AI/ML', 'Data Science', 'Cloud Computing', 'DevOps', 'UI/UX Design', 'Cybersecurity'];
const SKILLS = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Angular', 'Vue.js', 'TypeScript', 'C++', 'SQL', 'MongoDB'];
const COMPANIES = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Salesforce'];

// --- Helper Functions ---
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomNumber = (min, max, decimals = 1) => (Math.random() * (max - min) + min).toFixed(decimals);
const getPassingYear = (currentYear) => {
  const academicYear = new Date().getFullYear();
  switch (currentYear) {
    case 'First Year': return academicYear + 4;
    case 'Second Year': return academicYear + 3;
    case 'Third Year': return academicYear + 2;
    case 'Fourth Year': return academicYear + 1;
    default: return academicYear + 4;
  }
};

async function updateStudentProfiles() {
  console.log('Fetching student users to update...');
  const usersSnapshot = await db.collection('students').where('role', '==', 'student').get();

  if (usersSnapshot.empty) {
    console.log('No student users found to update.');
    return;
  }

  console.log(`Found ${usersSnapshot.docs.length} students. Starting update...`);

  for (const doc of usersSnapshot.docs) {
    const currentYear = getRandomItem(YEARS);
    const isInterning = Math.random() > 0.5; // 50% chance

    const profileData = {
      department: 'ENTC',
      division: getRandomItem(DIVISIONS),
      currentYear: currentYear,
      tenthPercentage: getRandomNumber(80, 98),
      twelfthPercentage: getRandomNumber(75, 96),
      cgpa: getRandomNumber(7.5, 9.8),
      passingYear: getPassingYear(currentYear),
      interests: [...new Set([getRandomItem(INTERESTS), getRandomItem(INTERESTS)])], // 1-2 unique interests
      skills: [...new Set([getRandomItem(SKILLS), getRandomItem(SKILLS), getRandomItem(SKILLS)])], // 1-3 unique skills
      certificates: Math.random() > 0.4 ? [{ title: `${getRandomItem(SKILLS)} Fundamentals`, link: 'https://example.com/cert' }] : [],
      previousProjects: Math.random() > 0.6 ? `Developed a project on ${getRandomItem(INTERESTS)} using ${getRandomItem(SKILLS)}.` : '',
      currentlyPursuingInternship: isInterning ? 'Yes' : 'No',
      internshipDetails: isInterning 
        ? { companyName: getRandomItem(COMPANIES), stipend: `${getRandomNumber(15, 40, 0)}000 /month`, duration: `${getRandomNumber(2, 6, 0)} months` }
        : { companyName: '', stipend: '', duration: '' },
    };

    try {
      await db.collection('students').doc(doc.id).update(profileData);
      console.log(`Successfully updated profile for ${doc.data().email}`);
    } catch (error) {
      console.error(`Failed to update profile for ${doc.data().email}:`, error.message);
    }
  }

  console.log('Finished updating all student profiles.');
}

updateStudentProfiles();
