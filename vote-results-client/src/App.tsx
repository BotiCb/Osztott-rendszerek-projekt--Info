import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const hardcodedResults = [
  { option: "Macska", votes: 12 },
  { option: "Kutya", votes: 20 },
  { option: "Papagáj", votes: 8 },
  { option: "Hal", votes: 5 },
  { option: "Tengerimalac", votes: 10 },
];

function App() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem", backgroundColor: "#f4f4f4", minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", color: "#333" }}>🐾 Szavazás jelenlegi eredményei</h1>
      <p style={{ textAlign: "center", color: "#666", marginBottom: "2rem" }}>
        Az alábbi diagram mutatja a szavazás állását kedvenc háziállatokról.
      </p>

      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <BarChart data={hardcodedResults} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="option" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="votes" fill="#82ca9d" name="Szavazatok száma" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default App;
