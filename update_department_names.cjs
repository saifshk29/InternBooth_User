const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const OLD_NAMES = [
  'ENTC',
  'Electronics & communication',
  'Electronics & Communication',
  'Electronics and Communication',
  'Electronics & Comm',
  'E&TC',
];

const NEW_NAME = 'ELECTRONICS AND TELECOMMUNICATION';

async function updateCollectionDepartments(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  let updated = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const current = (data.department || '').trim();
    if (!current) continue;
    if (OLD_NAMES.some((n) => n.toLowerCase() === current.toLowerCase())) {
      await db.collection(collectionName).doc(doc.id).update({ department: NEW_NAME });
      updated += 1;
      console.log(`[${collectionName}] Updated ${doc.id} from "${current}" -> "${NEW_NAME}"`);
    }
  }
  console.log(`[${collectionName}] Total updated: ${updated}`);
}

async function main() {
  console.log('Starting department normalization...');
  await updateCollectionDepartments('students');
  await updateCollectionDepartments('users');
  await updateCollectionDepartments('faculty');
  console.log('Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


