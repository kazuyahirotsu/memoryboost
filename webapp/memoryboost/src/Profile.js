import React, {useState, useEffect} from 'react'
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore, getDocs, collection, query, where } from "firebase/firestore";
import { firebaseConfig } from './firebaseConfig';
import { useParams } from "react-router-dom";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// const analytics = getAnalytics(app);


function Profile() {
  const {id} = useParams();
  const [timestamps, setTimestamps] = useState();

  // get timestamp of the face recognition from firestore
  const getFaceTimes = async() => {
    let receivedTimestamps = []
    const q = query(collection(db, "users", "kazuya", "faces"), where("faces", "array-contains", id));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const t = new Date(doc.data().time.seconds*1000+doc.data().time.nanoseconds/1000000)
      receivedTimestamps.push(String(t));
    });
    setTimestamps(receivedTimestamps)

  }

  useEffect(() => {
    getFaceTimes();
  },[])

  return (
    <div>
        <div className='text-center'>
            <p className='text-3xl my-5 text-primary'>{id}</p>
            <div className='flex flex-col items-center'>
                {timestamps?.map((time,idx) => 
                <p key={idx}>{time}</p>
                )}
            </div>
        </div>
    </div>
  );
}

export default Profile;
