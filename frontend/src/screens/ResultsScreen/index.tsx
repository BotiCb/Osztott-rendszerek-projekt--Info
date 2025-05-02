import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './styles.css';
import { useNavigate } from 'react-router-dom';

const ResultsScreen = () => {
  const [forms, setForms] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:3000/api/form')
      .then(res => setForms(res.data))
      .catch(err => console.error('Formok lekérdezése sikertelen:', err));
  }, []);

  return (
    <div className="results-wrapper">
      <div className="results-container">
        <h2>Elérhető Szavazások</h2>
        <div className="form-list">
          {forms.length === 0 ? (
            <p>Nincs elérhető form.</p>
          ) : (
            forms.map((form) => (
              <div className="form-card" key={form.name}>
                <h3>{form.name}</h3>
                <p>Kérdések száma: {form.questions?.length || 0}</p>
                <button onClick={() => navigate(`/fill/${form.name}`)}>
                  Kitöltés
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
