import React, {useState, useEffect} from 'react'
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, updateDoc, setDoc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { getStorage, ref, listAll, getDownloadURL, uploadBytes } from "firebase/storage";
import { firebaseConfig } from './firebaseConfig';
import { useParams } from "react-router-dom";
import TextareaAutosize from 'react-textarea-autosize';
import { Link } from "react-router-dom";
import Menu from "./Menu";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
// const analytics = getAnalytics(app);


function Profile() {
  const {id} = useParams();
  const [appearedVideos, setAppearedVideos] = useState([]);
  const [profile, setProfile] = useState("");
  const [profileDB, setProfileDB] = useState("");
  const [saveColor, setSaveColor] = useState("")


  // get timestamp of the face recognition from firestore
  const getFaceTimes = async() => {
    console.log("getting the videos of the appearance");
    const q = query(collection(db, "users", "kazuya", "videos"), where("faces", "array-contains", id));

    const videoData = await getDocs(q);

    videoData.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      const t = new Date(doc.data().date.seconds*1000+doc.data().date.nanoseconds/1000000)
      getDownloadURL(ref(storage, doc.data().thumbnail_url))
      .then((thumbnail_url) => {
        getDownloadURL(ref(storage, doc.data().video_url))
        .then((video_url) => {
          setAppearedVideos(arr => [...arr, [doc.id, thumbnail_url, video_url, doc.data().summarized_text, doc.data().faces, String(t)]]) 
        });   
      });
    });
  }

  const updateProfile = async(newProfile) => {
    console.log("updating the profile");
    try{
      const docRef = doc(db, "users", "kazuya", "profiles", id);
      await updateDoc(docRef, {
        profile: newProfile,
      });
    }catch(err){
      await setDoc(doc(db, "users", "kazuya", "profiles", id), {
        profile: newProfile,
        videos: [],
      });
      console.error(err);
      // alert(err.message);
    }
    setProfileDB(newProfile);
    checkProfile();
  }

  const getProfile = async () => {
    console.log("getting the profile");
    const docRef = doc(db, "users", "kazuya", "profiles", id);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    setProfile(data.profile);
    setProfileDB(data.profile);
  }

  const checkProfile = async () => {
    console.log("checking the profile change");
    if(profile == profileDB){
      setSaveColor("");
    }else{
      setSaveColor("btn-secondary");
    }
  }

  useEffect(() => {
    getProfile();
    getFaceTimes();
  },[])

  useEffect(() => {
    checkProfile();
  }, [profile])

  return (
    <div>
      <Menu page="faces" />
      <div className='flex flex-col text-center items-center mt-10'>
          <p className='text-3xl my-10 text-secondary'>{id}</p>

          <div className="card bg-neutral-focus shadow-xl mb-5 w-3/4">
            <div className="card-body">
              <p className="card-title text-secondary">Profile</p>
              <div className="flex flex-col items-center">
                <TextareaAutosize
                  className="input w-11/12 my-4"
                  value={profile}
                  placeholder={profile}
                  onChange={async (e) => setProfile(e.target.value)}
                />
                <button className={"btn w-1/6 "+saveColor} onClick={async () => {updateProfile(profile)}}>Save</button>
              </div>
            </div>
          </div>

          <div className="card bg-neutral-focus shadow-xl mb-5 w-3/4">
            <div className="card-body">
              <p className="card-title text-secondary">Videos</p>
              <div className='flex flex-col items-center'>
                {appearedVideos?.map((nameandthumbnail,idx) => 
                <div key={idx} className='flex my-2'>
                  <Link className="w-1/2 mx-1" to={"/videos/"+nameandthumbnail[0]}><img className='' src={nameandthumbnail[1]} /></Link>

                  <div className='w-1/2 flex flex-col mx-1'>
                    <Link className="my-1" to={"/videos/"+nameandthumbnail[0]}>{nameandthumbnail[0]}</Link>
                    <p className='my-1'>{nameandthumbnail[5]}</p>
                    <div className='my-1'>
                      {nameandthumbnail[4].map((face,idx2) => 
                        <p key={idx2} className='badge badge-primary w-24 mx-1'>{face}</p>
                      )}
                    </div>
                    <textarea className='my-1 textarea textarea-primary textarea-ghost focus:outline-0 focus:bg-transparent h-32' readOnly={true} value={nameandthumbnail[3]}></textarea>
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

export default Profile;
