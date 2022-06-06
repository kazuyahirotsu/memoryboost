import "./App.css";
import { BrowserRouter as Router, Route, Routes, useParams } from "react-router-dom";
import Faces from "./Faces";
import Profile from "./Profile";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route exact path="/" element={<Faces />} />
          <Route exact path="/:id" element={<Profile id = {useParams()}/>} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;