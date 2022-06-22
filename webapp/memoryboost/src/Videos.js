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

  const [videoList, setVideoList] = useState([]);
  
  const getVideoList = async() => {
    console.log("getting video list");
    // Create a reference under which you want to list
    const listRef = ref(storage, 'kazuya/videos');

    setVideoList([]);

    // Find all the prefixes and items.
    listAll(listRef)
      .then((res) => {
        res.items.forEach((itemRef) => {
          setVideoList(arr => [...arr, itemRef._location.path_.slice(14,)])
        });
      }).catch((error) => {
        // Uh-oh, an error occurred!
        console.log(error);
      });
  }

  useEffect(() => {
    getVideoList();
  },[])

  return (
    <div className="Videos">
      <Menu page="Videos" />
      <div className='text-center'>
        {videoList?.map((videoname,idx) => 
          <p key={idx}>{videoname}</p>
        )}
      </div>
    </div>
  );
}

export default Videos;
