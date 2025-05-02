import React, { useState } from 'react';
import axios from 'axios';
import './styles.css';

const VoteScreen = () => {
  const [formName, setFormName] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('text');
  const [selectedForm, setSelectedForm] = useState('');
  const [forms, setForms] = useState<any[]>([]);

  const handleCreateForm = async () => {
    try {
      await axios.post('http://localhost:3000/api/form', { name: formName });
      alert('Form létrehozva!');
      setFormName('');
    } catch (error) {
      alert('Hiba a form létrehozásakor');
    }
  };

  const handleAddQuestion = async () => {
    try {
      await axios.put(`http://localhost:3000/api/form/${selectedForm}`, {
        questionText,
        questionType,
      });
      alert('Kérdés hozzáadva!');
      setQuestionText('');
    } catch (error) {
      alert('Hiba a kérdés hozzáadásakor');
    }
  };

  const handleGetForms = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/form');
      setForms(res.data);
    } catch (error) {
      alert('Hiba a formok lekérdezésekor');
    }
  };

  return (
    <div className="vote-wrapper">
      <div className="vote-container">
        <h2>Form Kezelés</h2>

        {/* Form létrehozása */}
        <div className="form-block">
          <h3>Form létrehozása</h3>
          <input
            type="text"
            placeholder="Form neve"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />
          <button onClick={handleCreateForm}>Create Form</button>
        </div>

        {/* Kérdés hozzáadása */}
        <div className="form-block">
          <h3>Kérdés hozzáadása formhoz</h3>
          <input
            type="text"
            placeholder="Form neve"
            value={selectedForm}
            onChange={(e) => setSelectedForm(e.target.value)}
          />
          <input
            type="text"
            placeholder="Kérdés szövege"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
          />
          <select
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value)}
          >
            <option value="text">Szöveges</option>
            <option value="radio">Választható (radio)</option>
          </select>
          <button onClick={handleAddQuestion}>Add Question</button>
        </div>

        {/* Formok lekérdezése */}
        <div className="form-block">
          <h3>Formok lekérdezése</h3>
          <button onClick={handleGetForms}>Get All Forms</button>
          {forms.length > 0 && (
            <ul>
              {forms.map((form) => (
                <li key={form.id}>{form.name}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoteScreen;
