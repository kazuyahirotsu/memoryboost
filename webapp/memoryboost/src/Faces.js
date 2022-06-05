import React, {useState, useEffect} from 'react'
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { firebaseConfig } from './firebaseConfig';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);


function Faces() {
  const [faces, setFaces] = useState();

  // get known face list from firestore
  const getFaces = async() => {
    const docRef = doc(db, "users", "kazuya"); //just for kazuya now
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.log("Document data:", docSnap.data());
      setFaces(docSnap.data().faces_master)
    } else {
      console.log("No such document!");
    }
  }

  useEffect(() => {
    getFaces();
  },[])

  // todo: clicking on names brings timestamp of their appearance(goes their page)
  return (
    <div className="Faces">
        <div className='text-center'>
            <p className='text-3xl my-5 text-primary'>known faces</p>
            <p>{console.log(faces)}</p>
            <div className='flex flex-col items-center'>
                {faces?.map((face,idx) => 
                <button className="btn w-1/6 my-1" key={idx}>{face}</button>
                )}
            </div>
        </div>
    </div>
  );
}

export default Faces;
