import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateRequisition from "./pages/CreateRequisition";
import MyRequisitions from "./pages/MyRequisitions";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create" element={<CreateRequisition />} />
        <Route path="/my" element={<MyRequisitions />} />
      </Routes>
    </Router>
  );
}

export default App;
