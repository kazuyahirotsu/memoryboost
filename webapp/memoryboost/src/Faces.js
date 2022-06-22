import React, {useState, useEffect} from 'react'
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getStorage, ref, listAll, getDownloadURL, uploadBytes } from "firebase/storage";
import { getFirestore, getDoc, doc, setDoc } from "firebase/firestore";
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
  const [uploadFile , setUploadFile] = useState("");
  const [uploadName , setUploadName] = useState("");
  const [uploading, setUploading] = useState("");
  const [nameExist, setNameExist] = useState(false);
  const [disableUploadButton, setDisableUploadButton] = useState(false);

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

  const uploadItem = async (item) => {
    try{
        setUploading("Uploading...")
        const userItemsRef = ref(storage, `kazuya/face_images/${uploadName}${item.name.slice(-4,)}`);
        uploadBytes(userItemsRef, item).then((snapshot) => {
            console.log('Uploaded a blob or file!');
            setUploading("Uploaded!");
          });

        await setDoc(doc(db, "users", "kazuya", "profiles", uploadName), {
          profile: "You can write his/her profile here",
          videos: []
        });

    }catch(err){
        console.error(err);
        setUploading("Error occurred");
    }
  }

  const checkUploadName = async () => {
    if(faceImageUrl.map(x=>x[0]).includes(uploadName)){
      setNameExist(true);
      setDisableUploadButton(true);
      console.log("That name already exists");
    }else{
      if(uploadName==""){
        setDisableUploadButton(true);
      }else{
        setDisableUploadButton(false);
      }
      setNameExist(false);
    }

  } 

  useEffect(() => {
    getFaceImages();
  },[])

  useEffect(() => {
    setFaceImageUrlRender(faceImageUrl.slice().sort((a,b) => {return(b[2] - a[2])}));
    // fix this to sort only after all the faces are loaded
  },[faceImageUrl])

  useEffect(() => {
    checkUploadName();
  },[uploadName])

  return (
    <div className="Faces">
      <Menu page="faces" />
      <div className='flex flex-col text-center items-center mt-20'>

        <div className='card mx-2 my-2 w-3/4 bg-neutral-focus'>
          <div className='card-body flex flex-col'>
            <p className='card-title text-secondary'>Add New Face</p>
            
            <p className='text-accent mt-5'>Choose file</p>
            <input className="file:btn" type="file" accept=".jpg, .png" onChange={(e)=>{setUploadFile(e.target.files[0])}}/>
            
            <p className='text-accent mt-5'>What's his/her name?</p>
            <input
                  type="text"
                  className="input"
                  value={uploadName}
                  placeholder={uploadName}
                  onChange={async (e) => setUploadName(e.target.value)}
            />
            {nameExist &&
              <div className="alert alert-error shadow-lg">
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className=''>That name already exists. Pick different one.</p>
                </div>
              </div>
            }
          </div>
          <div className="card-actions justify-end">
            <p>{uploading}</p>
            <button 
              className="btn"
              onClick={async () => {
              uploadItem(uploadFile);}}
              disabled={disableUploadButton}>
                Upload</button>
          </div>
        </div>

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
