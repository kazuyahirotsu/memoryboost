import React, {useState, useEffect} from 'react'
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getStorage, ref, listAll, getDownloadURL, uploadBytes } from "firebase/storage";
import { getFirestore, getDoc, doc, setDoc } from "firebase/firestore";
import { firebaseConfig } from './firebaseConfig';
import TextField from '@mui/material/TextField';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import Menu from "./Menu";



function Videos() {

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const storage = getStorage(app);
  // const analytics = getAnalytics(app);\

  const [videoList, setVideoList] = useState([]);
  const [uploadFile , setUploadFile] = useState("");
  const [uploadName , setUploadName] = useState("");
  const [uploading, setUploading] = useState("");
  const [nameExist, setNameExist] = useState(false);
  const [disableUploadButton, setDisableUploadButton] = useState(false);
  const [date, setDate] = useState(new Date());
  
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

  const uploadItem = async (item) => {
    try{
        setUploading("Uploading...")
        const userItemsRef = ref(storage, `kazuya/videos/${uploadName}${item.name.slice(-4,)}`);
        uploadBytes(userItemsRef, item).then((snapshot) => {
            console.log('Uploaded a blob or file!');
            setUploading("Uploaded!");
          });

        await setDoc(doc(db, "users", "kazuya", "videos", `${uploadName}${item.name.slice(-4,)}`), {
          faces: [],
          text: "",
          thumbnail_url: "",
          video_url: "",
          date: date,
        });

    }catch(err){
        console.error(err);
        setUploading("Error occurred");
    }
  }

  const checkUploadName = async () => {
    if(videoList.includes(uploadName)){
      setNameExist(true);
      setDisableUploadButton(true);
      console.log("That name already exists");
    }else{
      if(uploadName=="" || uploadFile==""){
        setDisableUploadButton(true);
      }else{
        setDisableUploadButton(false);
      }
      setNameExist(false);
    }

  } 

  useEffect(() => {
    getVideoList();
  },[])

  useEffect(() => {
    checkUploadName();
  },[uploadName, uploadFile])
  const color = "#e5e7eb";

  return (
    <div className="Videos">
      <Menu page="Videos" />
      <div className='flex flex-col text-center items-center'>
        <div className='card mx-2 my-2 w-3/4 bg-neutral-focus'>
          <div className='card-body flex flex-col'>
            <p className='card-title text-secondary'>Add New Video</p>
            
            <p className='text-accent mt-5'>Choose file</p>
            <input className="file:btn" type="file" accept=".mp4" onChange={(e)=>{setUploadFile(e.target.files[0])}}/>
            
            <p className='text-accent mt-5'>What's the title?</p>
            <input
                  type="text"
                  className="input"
                  value={uploadName}
                  placeholder={uploadName}
                  onChange={async (e) => setUploadName(e.target.value)}
            />
            {nameExist &&
              <div class="alert alert-error shadow-lg">
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className=''>That name already exists. Pick different name.</p>
                </div>
              </div>
            }
            <p className='text-accent mt-5'>When was this?</p>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                renderInput={(props) => {
                  return (<TextField 
                      {...props} 
                      sx={{
                        svg: { color },
                        input: { color },
                        label: { color },
                        border: '1px solid #e5e7eb',
                        borderRadius: 1
                      }}
                    />
                  );
                }}
                value={date}
                onChange={(newValue) => {
                  setDate(newValue);
                }}
              />
            </LocalizationProvider>
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

        <div className="card bg-neutral-focus shadow-xl mb-5 w-3/4">
          <div className="card-body">
            <p className="card-title text-secondary">Videos</p>
            <div className='flex flex-col items-center'>
              {videoList?.map((videoname,idx) => 
              <p key={idx}>{videoname}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Videos;
