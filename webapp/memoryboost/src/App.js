import "./App.css";
import { BrowserRouter as Router, Route, Routes, useParams } from "react-router-dom";
import Faces from "./Faces";
import Videos from "./Videos";
import Profile from "./Profile";
import Video from "./Video";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route exact path="/" element={<Faces />} />
          <Route exact path="/videos" element={<Videos />} />
          <Route exact path="/:id" element={<Profile id = {useParams()}/>} />
          <Route exact path="/videos/:id" element={<Video id = {useParams()}/>} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;