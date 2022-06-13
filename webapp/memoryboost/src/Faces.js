import React, {useState, useEffect} from 'react'
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import { getFirestore, getDocs, collection, query, where } from "firebase/firestore";
import { firebaseConfig } from './firebaseConfig';
import { Link } from "react-router-dom";



function Faces() {

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const storage = getStorage(app);
  // const analytics = getAnalytics(app);\

  const [faceImageUrl, setFaceImageUrl] = useState([]);
  const [faceImageUrlRender, setFaceImageUrlRender] = useState([]);

  // get timestamp of the face recognition from firestore
  const getFaceTimes = async(id) => {
    let receivedTimestamps = []
    const q = query(collection(db, "users", "kazuya", "faces"), where("faces", "array-contains", id));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      const t = new Date(doc.data().time.seconds*1000+doc.data().time.nanoseconds/1000000)
      receivedTimestamps.push(String(t));
    });

    return receivedTimestamps.length
  }

  const getFaceImages = async() => {
    // Create a reference under which you want to list
    const listRef = ref(storage, 'kazuya/face_images');

    setFaceImageUrl([]);

    // Find all the prefixes and items.
    listAll(listRef)
      .then((res) => {
        res.items.forEach((itemRef) => {
          // All the items under listRef.
          getDownloadURL(ref(storage, itemRef._location.path_))
          .then((url) => {
            getFaceTimes(itemRef._location.path_.slice(19,-4))
            .then((res)=>{
              setFaceImageUrl(arr => [...arr, [itemRef._location.path_.slice(19,-4), url, res]]);
            })
            
          });
        });
      }).catch((error) => {
        // Uh-oh, an error occurred!
        console.log(error);
      });
  }

  useEffect(() => {
    getFaceImages();
  },[])

  useEffect(() => {
    setFaceImageUrlRender(faceImageUrl.slice().sort((a,b) => {return(b[2] - a[2])}));
  },[faceImageUrl])

  return (
    <div className="Faces">
        <div className='text-center'>
            <p className='text-3xl my-10 text-primary'>known faces</p>
            {console.log(faceImageUrl)}
            <div className='flex flex-wrap justify-center'>
                {faceImageUrlRender?.map((nameandurl,idx) => 
                <div className='card w-60 mx-2 my-2 bg-base-300' key={idx}>
                  <Link className="" to={"/"+nameandurl[0]}><figure><img src={nameandurl[1]} /></figure></Link>
                  <div className='card-body'>
                  <Link className="btn btn-primary text-xl" to={"/"+nameandurl[0]}>{nameandurl[0]}</Link>
                  <p>{nameandurl[2]}</p>
                  </div>
                </div>
                )}
            </div>
        </div>
    </div>
  );
}

export default Faces;
