// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const { getFirestore, Firestore} = require('firebase/firestore');
const { doc, setDoc } = require('firebase/firestore');
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBlffW-mcI-bIJ2CDYD8dSGssKXiOPm76Y",
  authDomain: "sihdatabase-b40d4.firebaseapp.com",
  projectId: "sihdatabase-b40d4",
  storageBucket: "sihdatabase-b40d4.appspot.com",
  messagingSenderId: "669004339339",
  appId: "1:669004339339:web:6a5f5da76b3a0b9fc89c8e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

const firestore = getFirestore(app);
// const jsonData = require('../jsons/new.json')
// console.log(jsonData)
// jsonData.forEach(element => {
//     setDoc(doc(firestore,"teams2",jsonData[0].team_id),jsonData[0])
// });
// for (let index = 0; index < jsonData.length; index++) {
//     const element = jsonData[index];
//         setDoc(doc(firestore,"teams2",element.team_id),element)
// }
// let idx=0
// let x = setInterval(()=>{
//     setDoc(doc(firestore,"teams",jsonData[idx].team_id),jsonData[idx])
//     idx++;
// },2000)
module.exports = firestore;