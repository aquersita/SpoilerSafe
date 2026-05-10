import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./spoilersafe-365f3-firebase-adminsdk-fbsvc-0573e0df7a.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const auth = admin.auth();

const MAX_USERNAME_LENGTH = 20;

async function deleteTestUsers() {
  const usernamesSnap = await db.collection('usernames').get();
  const toDelete = usernamesSnap.docs.filter(d => d.id.length > MAX_USERNAME_LENGTH);

  if (toDelete.length === 0) {
    console.log('No se encontraron usuarios con username larguísimo.');
    return;
  }

  console.log(`Encontrados ${toDelete.length} usuarios con username > ${MAX_USERNAME_LENGTH} caracteres:`);

  for (const d of toDelete) {
    const { uid } = d.data();
    console.log(`  - username: "${d.id}" | uid: ${uid}`);

    // Eliminar de Firestore: users y usernames
    await db.collection('users').doc(uid).delete();
    await db.collection('usernames').doc(d.id).delete();
    console.log(`    → Eliminado de Firestore`);

    // Eliminar de Firebase Auth
    try {
      await auth.deleteUser(uid);
      console.log(`    → Eliminado de Firebase Auth`);
    } catch (err) {
      console.log(`    → Auth no encontrado (${err.code}), Firestore sí eliminado`);
    }
  }

  console.log('\nListo. Todos los usuarios de prueba eliminados.');
}

deleteTestUsers().catch(console.error).finally(() => process.exit(0));
