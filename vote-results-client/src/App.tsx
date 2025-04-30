// src/App.tsx
import { useEffect, useState } from "react";
import axios from "axios";

type VoteResult = {
  option: string;
  votes: number;
};

function App() {
  const [results, setResults] = useState<VoteResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get<VoteResult[]>("http://localhost:5432/vote-counts") // <- ezt állítsd be a saját API-d endpointjára
      .then((res) => {
        setResults(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Hiba történt az adatok lekérdezésekor.");
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Betöltés...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Szavazás eredmények</h1>
      <ul>
        {results.map((result) => (
          <li key={result.option}>
            <strong>{result.option}:</strong> {result.votes} szavazat
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
