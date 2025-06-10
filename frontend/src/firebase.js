import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCaSP26cg8t8WUw5-aYue2XmyiTTlwWCfk",
  authDomain: "islam-9ae1e.firebaseapp.com",
  projectId: "islam-9ae1e",
  storageBucket: "islam-9ae1e.firebasestorage.app",
  messagingSenderId: "613440278055",
  appId: "1:613440278055:web:1fcce513ef557eb4a98802",
  measurementId: "G-0VPCMTCEH9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

export default app;