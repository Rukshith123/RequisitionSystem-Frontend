import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { createRequisition, generateJd } from "../services/api";
import Layout from "../components/Layout";
import "../styles/createRequisition.css";

const jdEditorModules = {
  toolbar: [
    [{ size: ["small", false, "large", "huge"] }],
    ["bold", "italic", "underline"],
    [{ color: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }]
  ]
};

const jdEditorFormats = [
  "size",
  "bold",
  "italic",
  "underline",
  "color",
  "list",
  "bullet",
  "align"
];

function CreateRequisition() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    department: "",
    skillset: "",
    experienceLevel: "",
    numberOfPositions: "",
    location: "",
    hireByDate: "",
    customerName: "",
    comments: "",
    jdContent: ""
  });
  const [isGeneratingJd, setIsGeneratingJd] = useState(false);
  const [jdError, setJdError] = useState("");

  const handleGenerateJd = async () => {
    if (!form.title || !form.department || !form.skillset || !form.experienceLevel) {
      setJdError("Please fill in Title, Department, Skillset and Experience Level before generating.");
      return;
    }
    setJdError("");
    setIsGeneratingJd(true);
    try {
      const html = await generateJd(form);
      setForm((prev) => ({ ...prev, jdContent: html }));
    } catch (error) {
      setJdError(error.message || "Failed to generate JD. Please try again.");
    } finally {
      setIsGeneratingJd(false);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.department || !form.skillset || !form.experienceLevel || !form.numberOfPositions) {
      alert("Please fill all required fields");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));
    const data = {
      title: form.title,
      department: form.department,
      skillset: form.skillset,
      experienceLevel: form.experienceLevel,
      numberOfPositions: Number(form.numberOfPositions),
      location: form.location,
      hireByDate: form.hireByDate,
      customerName: form.customerName,
      comments: form.comments,
      jdContent: form.jdContent
    };

    try {
      await createRequisition(data, user.id);
      alert("Requisition created successfully!");
      setForm({
        title: "",
        department: "",
        skillset: "",
        experienceLevel: "",
        numberOfPositions: "",
        location: "",
        hireByDate: "",
        customerName: "",
        comments: "",
        jdContent: ""
      });
      navigate("/my");
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
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="department">Department</label>
              <select
                id="department"
                name="department"
                value={form.department}
                onChange={handleChange}
                required
              >
                <option value="">Select department</option>
                <option value="Nexer EA">Nexer EA</option>
                <option value="Nexer Pvt Ltd">Nexer Pvt Ltd</option>
              </select>
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
                required
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
                required
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
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="location">Location</label>
              <select
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
              >
                <option value="">Select location</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Remote">Remote</option>
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="hireByDate">Hire By Date</label>
              <input
                id="hireByDate"
                name="hireByDate"
                type="date"
                value={form.hireByDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="customerName">Customer Name</label>
              <input
                id="customerName"
                name="customerName"
                type="text"
                placeholder="e.g. Volvo Group"
                value={form.customerName}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="comments">Comments (e.g. urgent notes)</label>
              <textarea
                id="comments"
                name="comments"
                rows="2"
                placeholder="Add context, urgency, dependencies, etc."
                value={form.comments}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <div className="jd-field-header">
                <label htmlFor="jdContent">Job Description</label>
                <button
                  type="button"
                  className="generate-jd-button"
                  onClick={handleGenerateJd}
                  disabled={isGeneratingJd}
                >
                  {isGeneratingJd ? "Generating..." : "✨ Generate JD"}
                </button>
              </div>
              {jdError && <p className="jd-error-message">{jdError}</p>}
              <ReactQuill
                id="jdContent"
                className="jd-editor"
                theme="snow"
                modules={jdEditorModules}
                formats={jdEditorFormats}
                placeholder="Write the full job description here..."
                value={form.jdContent}
                onChange={(value) => setForm({ ...form, jdContent: value })}
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