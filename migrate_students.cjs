const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateStudents() {
  console.log('Starting student migration...');
  const usersRef = db.collection('users');
  const studentsRef = db.collection('students');

  const snapshot = await usersRef.where('role', '==', 'student').get();

  if (snapshot.empty) {
    console.log('No student documents found in users collection to migrate.');
    return;
  }

  console.log(`Found ${snapshot.docs.length} students to migrate.`);

  for (const doc of snapshot.docs) {
    const userData = doc.data();
    const userId = doc.id;

    try {
      // Set the data in the 'students' collection with the same document ID
      await studentsRef.doc(userId).set(userData);
      console.log(`Successfully copied ${userData.email} to students collection.`);

      // Optionally, delete the document from the 'users' collection after copy
      // await usersRef.doc(userId).delete();
      // console.log(`Successfully deleted ${userData.email} from users collection.`);

    } catch (error) {
      console.error(`Failed to migrate ${userData.email}:`, error.message);
    }
  }

  console.log('Student migration finished.');
}

migrateStudents();
