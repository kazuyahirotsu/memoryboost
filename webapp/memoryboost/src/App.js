import "./App.css";
import { BrowserRouter as Router, Route, Routes, Switch, useParams } from "react-router-dom";
import Faces from "./Faces";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route exact path="/" element={<Faces />} />
        </Routes>
      </Router>
    </div>
  );
}

//<Route exact path="/:id" element={<Custom id = {useParams()}/>} />

export default App;