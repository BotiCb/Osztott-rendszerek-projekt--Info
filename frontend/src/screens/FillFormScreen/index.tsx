import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './styles.css';

interface Question {
  _id: string;
  questionText: string;
  questionType: string;
}

const FillFormScreen = () => {
  const { formName } = useParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/form?name=${formName}`);
        const form = response.data[0];
        if (form?.questions) {
          setQuestions(form.questions);
        } else {
          alert('Nem található kérdés ehhez a formhoz.');
        }
      } catch (err) {
        console.error(err);
        alert('Hiba történt az űrlap lekérésekor.');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formName]);

  const handleChange = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = () => {
    console.log('Kitöltött válaszok:', answers);
    alert('Köszönjük a kitöltést!');
  };

  if (loading) return <p>Betöltés...</p>;

  return (
    <div className="fill-form-container">
      <h2>Űrlap kitöltése: {formName}</h2>
      {questions.length === 0 ? (
        <p>Nincs kérdés ebben az űrlapban.</p>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {questions.map((q) => (
            <div key={q._id} className="question-block">
              <label>{q.questionText}</label>
              <input
                type="text"
                onChange={(e) => handleChange(q._id, e.target.value)}
                className="input-field"
                required
              />
            </div>
          ))}
          <button type="submit" className="submit-button">Beküldés</button>
        </form>
      )}
    </div>
  );
};

export default FillFormScreen;
