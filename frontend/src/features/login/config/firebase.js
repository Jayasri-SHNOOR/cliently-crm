import {initializeApp} from "firebase/app";
import {getAuth} from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if(!firebaseConfig.apiKey){
    throw new Error("Firebase config missing. Check VITE_FIREBASE_* values in .env and restart npm run dev.");
}
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);