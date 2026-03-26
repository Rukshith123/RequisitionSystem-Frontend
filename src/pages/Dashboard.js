import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <div>
      <h2>Dashboard</h2>

      <Link to="/create">
        <button>Create Requisition</button>
      </Link>

      <br /><br />

      <Link to="/my">
        <button>My Requisitions</button>
      </Link>
    </div>
  );
}

export default Dashboard;