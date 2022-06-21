import React, {useState, useEffect} from 'react'
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import { getFirestore, getDocs, collection, query, where } from "firebase/firestore";
import { firebaseConfig } from './firebaseConfig';
import { Link } from "react-router-dom";
import Menu from "./Menu";



function Videos() {

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const storage = getStorage(app);
  // const analytics = getAnalytics(app);\

  return (
    <div className="Videos">
      <Menu page="Videos" />
      <div className='text-center'>
      </div>
    </div>
  );
}

export default Videos;
