import React, {useState, useEffect} from 'react'
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore, doc, updateDoc, setDoc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { getStorage, ref, listAll, getDownloadURL, uploadBytes } from "firebase/storage";
import { firebaseConfig } from './firebaseConfig';
import { useParams } from "react-router-dom";
import Menu from "./Menu";


function Video() {

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const storage = getStorage(app);
  // const analytics = getAnalytics(app);

  const {id} = useParams();
  const [videoInfo, setVideoInfo] = useState([]);


  const getVideo = async () => {
    console.log("getting the video");
    const docRef = doc(db, "users", "kazuya", "videos", id);
    const videoInfoReceived = await getDoc(docRef);

    const t = new Date(videoInfoReceived.data().date.seconds*1000+videoInfoReceived.data().date.nanoseconds/1000000)
    getDownloadURL(ref(storage, videoInfoReceived.data().thumbnail_url))
    .then((thumbnail_url) => {
      getDownloadURL(ref(storage, videoInfoReceived.data().video_url))
      .then((video_url) => {
        setVideoInfo([videoInfoReceived.id, thumbnail_url, video_url, videoInfoReceived.data().text, videoInfoReceived.data().faces, String(t)]) 
      });   
    });

  }

  useEffect(() => {
    getVideo();
  },[])

  return (
    <div>
      <Menu page="faces" />
      <div className='flex flex-col text-center items-center mt-10'>
          <p className='text-3xl my-10 text-secondary'>{id}</p>

          <div className="card bg-neutral-focus shadow-xl mb-5 w-3/4">
            <div className="card-body">
              <div className='flex flex-col items-center'>
                {videoInfo.length==6 &&
                <div className='flex my-2'>
                  <a href={videoInfo[2]} className='w-1/2 mx-1'><img className='' src={videoInfo[1]} /></a>
                  <div className='w-1/2 flex flex-col mx-1'>
                    <p className='my-1'>{videoInfo[0]}</p>
                    <p className='my-1'>{videoInfo[5]}</p>
                    <div className='my-1'>
                      {videoInfo[4].map((face,idx2) => 
                        <p key={idx2} className='badge badge-primary w-24 mx-1'>{face}</p>
                      )}
                    </div>
                    <textarea className='my-1 textarea textarea-primary textarea-ghost focus:outline-0 focus:bg-transparent h-96' readOnly={true} value={videoInfo[3]}></textarea>
                  </div>
                </div>
                }
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}

export default Video;
