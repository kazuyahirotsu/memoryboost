import React, {useState, useEffect} from 'react'
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, listAll, getDownloadURL, uploadBytes } from "firebase/storage";
import { firebaseConfig } from './firebaseConfig';
import { useParams } from "react-router-dom";
import TextareaAutosize from 'react-textarea-autosize';
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

    const appearedVideosRef = doc(db, "users", "kazuya", "profiles", id);
    const docSnap = await getDoc(appearedVideosRef);
    const appearedVideosList = docSnap.data().videos
    appearedVideosList.forEach((video) => {
      // All the items under listRef.
      getDownloadURL(ref(storage, "kazuya/thumbnails/"+video.slice(0,-4)+"_thumbnail.jpg"))
      .then((url) => {
        setAppearedVideos(arr => [...arr, [video, url]])       
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
                <div key={idx}>
                <p>{nameandthumbnail[0]}</p>
                <figure><img className='object-cover h-48 w-96' src={nameandthumbnail[1]}/></figure>
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
