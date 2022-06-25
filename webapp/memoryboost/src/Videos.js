import React, {useState, useEffect} from 'react'
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getStorage, ref, listAll, getDownloadURL, uploadBytes } from "firebase/storage";
import { collection, getFirestore, getDocs, doc, setDoc } from "firebase/firestore";
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

    setVideoList([]);

    const videoData = await getDocs(collection(db, "users", "kazuya", "videos"));
    videoData.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      const t = new Date(doc.data().date.seconds*1000+doc.data().date.nanoseconds/1000000)
      getDownloadURL(ref(storage, doc.data().thumbnail_url))
      .then((thumbnail_url) => {
        getDownloadURL(ref(storage, doc.data().video_url))
        .then((video_url) => {
          setVideoList(arr => [...arr, [doc.id, thumbnail_url, video_url, doc.data().text, doc.data().faces, String(t)]]) 
        });   
      });
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
    if(videoList.includes(uploadName+".mp4")){
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
  const color = "#A6ADBA";

  return (
    <div className="Videos">
      <Menu page="Videos" />

      {/* Add New Video */}
      <div className='flex flex-col text-center items-center mt-20'>
        <div tabIndex="0" className="collapse collapse-plus bg-neutral-focus rounded-box mb-1 w-3/4">
          <input type="checkbox" className="peer" /> 
          <p className='collapse-title text-secondary text-xl text-left font-semibold'>Add New Video</p>
          <div className='collapse-content flex flex-col'>
            <p className='text-accent mt-5'>Choose the video</p>
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
              <div className="alert alert-error shadow-lg">
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className=''>That title already exists. Pick different one.</p>
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
                        border: '1px solid #A6ADBA',
                        borderRadius: 2
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
            <div className="card-actions justify-end mt-5">
              <p>{uploading}</p>
              <button 
                className="btn"
                onClick={async () => {
                uploadItem(uploadFile);}}
                disabled={disableUploadButton}>
                  Upload</button>
            </div>
          </div>
        </div>
        
        {/* Show Videos */}
        <div className="card bg-neutral-focus shadow-xl mb-5 w-3/4">
          <div className="card-body">
            <p className="card-title text-secondary">Videos</p>
            <div className='flex flex-col items-center'>
              {videoList?.map((nameandthumbnail,idx) => 
              <div key={idx} className='flex my-2'>
                <a href={nameandthumbnail[2]} className='w-1/2 mx-1'><img className='' src={nameandthumbnail[1]} /></a>

                <div className='w-1/2 flex flex-col mx-1'>
                  <p className='my-1'>{nameandthumbnail[0]}</p>
                  <p className='my-1'>{nameandthumbnail[5]}</p>
                  <div className='my-1'>
                    {nameandthumbnail[4].map((face,idx2) => 
                      <p key={idx2} className='badge badge-primary w-24 mx-1'>{face}</p>
                    )}
                  </div>
                  <textarea className='my-1 textarea textarea-primary textarea-ghost focus:outline-0 focus:bg-transparent' readOnly={true} value={nameandthumbnail[3]}></textarea>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Videos;
