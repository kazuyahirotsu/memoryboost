import React, {useState, useEffect} from 'react'
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import { firebaseConfig } from './firebaseConfig';
import { Link } from "react-router-dom";



function Faces() {

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const storage = getStorage(app);
  // const analytics = getAnalytics(app);\

  const [faceImageUrl, setFaceImageUrl] = useState([]);

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
            setFaceImageUrl(arr => [...arr, [itemRef._location.path_, url]]);
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

  return (
    <div className="Faces">
        <div className='text-center'>
            <p className='text-3xl my-10 text-primary'>known faces</p>
            <div className='flex flex-wrap justify-center'>
                {faceImageUrl?.map((nameandurl,idx) => 
                <div className='card w-60 mx-2 my-2 bg-base-300'>
                  <Link className="" to={"/"+nameandurl[0].slice(19,-4)}><figure><img src={nameandurl[1]} /></figure></Link>
                  <div className='card-body'>
                  <Link className="btn btn-primary text-xl" to={"/"+nameandurl[0].slice(19,-4)}>{nameandurl[0].slice(19,-4)}</Link>
                  </div>
                </div>
                )}
            </div>
        </div>
    </div>
  );
}

export default Faces;
