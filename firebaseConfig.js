// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: 'AIzaSyCwljpGf8seQWfw9xgHvIoDfe8DdkHbLfg',
	authDomain: 'music-storage-4ab45.firebaseapp.com',
	projectId: 'music-storage-4ab45',
	storageBucket: 'music-storage-4ab45.appspot.com',
	messagingSenderId: '300841564693',
	appId: '1:300841564693:web:94029047aff4c167cc6c1c',
	measurementId: 'G-17S5KB4T9D',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
//const analytics = getAnalytics(app)
