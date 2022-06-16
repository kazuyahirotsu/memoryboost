import React, {useState, useEffect} from 'react'
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore, getDocs, collection, query, where, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { firebaseConfig } from './firebaseConfig';
import { useParams } from "react-router-dom";
import TextareaAutosize from 'react-textarea-autosize';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// const analytics = getAnalytics(app);


function Profile() {
  const {id} = useParams();
  const [timestamps, setTimestamps] = useState();
  const [profile, setProfile] = useState("");
  const [profileDB, setProfileDB] = useState("");
  const [saveColor, setSaveColor] = useState("")

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

  const updateProfile = async(newProfile) => {
    try{
      const docRef = doc(db, "users", "kazuya", "profiles", id);
      await updateDoc(docRef, {
        profile: newProfile,
      });
    }catch(err){
      await setDoc(doc(db, "users", "kazuya", "profiles", id), {
        profile: newProfile,
      });
      console.error(err);
      // alert(err.message);
    }
    setProfileDB(newProfile);
  }

  const getProfile = async () => {
    const docRef = doc(db, "users", "kazuya", "profiles", id);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();
    setProfile(data.profile);
    setProfileDB(data.profile);
  }

  const checkProfile = async () => {
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
    console.log("check")
    checkProfile();
  }, [profile])

  return (
    <div>
        <div className='flex flex-col text-center items-center'>
            <p className='text-3xl my-5 text-primary'>{id}</p>

            <div className="card bg-neutral-focus shadow-xl mb-5 w-3/4">
              <div className="card-body">
                <p className="card-title text-secondary">Profile</p>
                <div className="flex flex-col items-center">
                  <TextareaAutosize
                    // type="textarea"
                    className="input w-11/12 my-4"
                    value={profile}
                    placeholder={profile}
                    onChange={async (e) => setProfile(e.target.value)}
                  />
                  <button className={"btn w-1/6 "+saveColor} onClick={async () => {updateProfile(profile)}}>Save</button>
                </div>
              </div>
            </div>

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
