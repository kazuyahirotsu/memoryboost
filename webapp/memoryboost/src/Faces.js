import React, {useState, useEffect} from 'react'
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import { getFirestore, getDoc, doc, collection, query, where } from "firebase/firestore";
import { firebaseConfig } from './firebaseConfig';
import { Link } from "react-router-dom";
import Menu from "./Menu";



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
    console.log("getting how many times "+id+" has appeared");

    const appearedVideosRef = doc(db, "users", "kazuya", "profiles", id);
    const docSnap = await getDoc(appearedVideosRef);
    const appearedVideos = docSnap.data().videos

    return appearedVideos.length
  }

  const getFaceImages = async() => {
    console.log("getting face images");
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
    // fix this to sort only after all the faces are loaded
  },[faceImageUrl])

  return (
    <div className="Faces">
      <Menu page="faces" />
      <div className='text-center'>
          <div className='flex flex-wrap justify-center my-10'>
            {faceImageUrlRender?.map((nameandurl,idx) => 
              <div className='card w-60 mx-2 my-2 bg-base-300' key={idx}>
                <Link className="" to={"/"+nameandurl[0]}><figure><img className='object-cover h-36 w-96' src={nameandurl[1]} /></figure></Link>
                <div className='card-body'>
                  <Link className="btn btn-primary text-xl" to={"/"+nameandurl[0]}>{nameandurl[0]}</Link>
                  <div className='card-actions justify-end mt-4'>
                    <div className='badge badge-secondary text-xl'>{nameandurl[2]}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}

export default Faces;
