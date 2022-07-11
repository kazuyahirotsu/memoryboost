import React, {useState, useEffect} from 'react'
import { Link } from "react-router-dom";

function Menu(props) {

  const [facesColor, setFacesColor] = useState("");
  const [videosColor, setVideosColor] = useState("");
  
  const pageColorCheck = async () => {
    console.log("checking the page change");
    if(props.page === "faces"){
      setFacesColor("text-secondary");
      setVideosColor("");
    }else{
      setFacesColor("");
      setVideosColor("text-secondary");
    }
  }
  
  useEffect(() => {
    pageColorCheck();
  }, [props.page])

  return (
    <div className="navbar bg-base-100">
      <div className='navbar-start'>
        <Link className="text-3xl" to={"/"}>memoryboost α</Link>
      </div>
      <div className="navbar-center">
        <ul className="menu menu-horizontal p-0">
          <Link className={"text-3xl "+facesColor} to={"/"}><li><a>faces</a></li></Link>
          <Link className={"text-3xl "+videosColor} to={"/videos"}><li><a>videos</a></li></Link>
        </ul>
      </div>
      <div className="navbar-end">
        <a className="btn">Get started</a>
      </div>
    </div>
  );
}

export default Menu;
