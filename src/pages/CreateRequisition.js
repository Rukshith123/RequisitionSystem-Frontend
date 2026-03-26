import { useState } from "react";

function CreateRequisition() {
  // Step 1: Form state
  const [form, setForm] = useState({
    department: "",
    skillset: "",
    experienceLevel: "",
    numberOfPositions: ""
  });

  // Step 2: Handle input change
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // Step 3: Handle submit
  const handleSubmit = () => {
  if (
    !form.department ||
    !form.skillset ||
    !form.experienceLevel ||
    !form.numberOfPositions
  ) {
    alert("Please fill all fields");
    return;
  }

  console.log("Form Data:", form);
  alert("Requisition Submitted!");
};

  return (
    <div>
      <h2>Create Requisition</h2>

      {/* Department */}
      <input
        type="text"
        name="department"
        placeholder="Department"
        onChange={handleChange}
      />
      <br /><br />

      {/* Skillset */}
      <input
        type="text"
        name="skillset"
        placeholder="Skillset"
        onChange={handleChange}
      />
      <br /><br />

      {/* Experience */}
      <input
        type="text"
        name="experienceLevel"
        placeholder="Experience Level"
        onChange={handleChange}
      />
      <br /><br />

      {/* Positions */}
      <input
        type="number"
        name="numberOfPositions"
        placeholder="Number of Positions"
        onChange={handleChange}
      />
      <br /><br />

      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}

export default CreateRequisition;