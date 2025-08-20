const admin = require('firebase-admin');

// IMPORTANT: Make sure you have downloaded your service account key and named it 'serviceAccountKey.json'
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const usersToCreate = [
  { firstName: 'Priya', lastName: 'Sharma', email: 'priyasharma@gmail.com' },
  { firstName: 'Rahul', lastName: 'Kumar', email: 'rahulkumar@gmail.com' },
  { firstName: 'Anjali', lastName: 'Singh', email: 'anjalisingh@gmail.com' },
  { firstName: 'Amit', lastName: 'Trivedi', email: 'amittrivedi@gmail.com' },
  { firstName: 'Sunita', lastName: 'Verma', email: 'sunitaverma@gmail.com' },
  { firstName: 'Vikas', lastName: 'Patel', email: 'vikaspatel@gmail.com' },
  { firstName: 'Neha', lastName: 'Mishra', email: 'nehamishra@gmail.com' },
  { firstName: 'Sanjay', lastName: 'Joshi', email: 'sanjayjoshi@gmail.com' },
  { firstName: 'Kavita', lastName: 'Gupta', email: 'kavitagupta@gmail.com' },
  { firstName: 'Manoj', lastName: 'Yadav', email: 'manojyadav@gmail.com' },
  { firstName: 'Pooja', lastName: 'Mehta', email: 'poojamehta@gmail.com' },
  { firstName: 'Rajesh', lastName: 'Reddy', email: 'rajeshreddy@gmail.com' },
  { firstName: 'Deepika', lastName: 'Chopra', email: 'deepikachopra@gmail.com' },
  { firstName: 'Arjun', lastName: 'Malhotra', email: 'arjunmalhotra@gmail.com' },
  { firstName: 'Geetanjali', lastName: 'Rao', email: 'geetanjalirao@gmail.com' }
];

const password = '1234567890';

async function createUsers() {
  console.log('Starting user creation...');
  for (const user of usersToCreate) {
    try {
      const userRecord = await admin.auth().createUser({
        email: user.email,
        password: password,
        displayName: `${user.firstName} ${user.lastName}`
      });

      console.log(`Successfully created user: ${user.email} with uid: ${userRecord.uid}`);

      // Now, create a document in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: 'student' // Set a default role
      });

      console.log(`Successfully created Firestore document for ${user.email}`);

    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error.message);
    }
  }
  console.log('User creation process finished.');
}

createUsers();
