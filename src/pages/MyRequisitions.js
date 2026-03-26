function MyRequisitions() {
  // Mock data (temporary)
  const requisitions = [
    {
      id: 1,
      department: "IT",
      skillset: "React",
      experienceLevel: "2 years",
      numberOfPositions: 2,
      status: "Pending"
    },
    {
      id: 2,
      department: "HR",
      skillset: "Recruitment",
      experienceLevel: "3 years",
      numberOfPositions: 1,
      status: "BUApproved"
    }
  ];

  return (
    <div>
      <h2>My Requisitions</h2>

      {requisitions.map((req) => (
        <div key={req.id} style={{ border: "1px solid black", margin: "10px", padding: "10px" }}>
          <p><b>Department:</b> {req.department}</p>
          <p><b>Skillset:</b> {req.skillset}</p>
          <p><b>Experience:</b> {req.experienceLevel}</p>
          <p><b>Positions:</b> {req.numberOfPositions}</p>
          <p><b>Status:</b> {req.status}</p>
        </div>
      ))}
    </div>
  );
}

export default MyRequisitions;