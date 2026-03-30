import { useState } from "react";
import { createRequisition } from "../services/api";
import Layout from "../components/Layout";
import "../styles/createRequisition.css";

function CreateRequisition() {
  // Step 1: Form state
  const [form, setForm] = useState({
    title: "",
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
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.department || !form.skillset || !form.experienceLevel || !form.numberOfPositions) {
      alert("Please fill all fields");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));
    const data = {
      title: form.title,
      department: form.department,
      skillset: form.skillset,
      experienceLevel: form.experienceLevel,
      numberOfPositions: Number(form.numberOfPositions)
    };

    try {
      await createRequisition(data, user.id);
      alert("Requisition created successfully!");
      setForm({
        title: "",
        department: "",
        skillset: "",
        experienceLevel: "",
        numberOfPositions: ""
      });
    } catch (error) {
      console.error(error);
      alert("Error creating requisition");
    }
  };

  return (
    <Layout>
      <div className="create-requisition-page">
        <div className="create-requisition-card">
          <h2>Create Requisition</h2>

          <form className="create-requisition-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="e.g. Senior Product Designer"
                value={form.title}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="department">Department</label>
              <input
                id="department"
                name="department"
                type="text"
                placeholder="e.g. Product"
                value={form.department}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="skillset">Skillset</label>
              <input
                id="skillset"
                name="skillset"
                type="text"
                placeholder="e.g. React, Node.js"
                value={form.skillset}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="experienceLevel">Experience Level</label>
              <input
                id="experienceLevel"
                name="experienceLevel"
                type="text"
                placeholder="e.g. 3+ years"
                value={form.experienceLevel}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="numberOfPositions">Number of Positions</label>
              <input
                id="numberOfPositions"
                name="numberOfPositions"
                type="number"
                min="1"
                placeholder="e.g. 3"
                value={form.numberOfPositions}
                onChange={handleChange}
              />
            </div>

            <button type="submit" className="submit-button">
              Submit Requisition
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default CreateRequisition;