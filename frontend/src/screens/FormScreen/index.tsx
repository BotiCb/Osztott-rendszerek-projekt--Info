// src/screens/FormScreen/FormScreen.tsx
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import io, { Socket } from "socket.io-client";
import {
  Container,
  Loader,
  Frame,
  Form,
  FormGroup,
  Label,
  Input,
  SubmitButton,
} from "./styles";
import { Question } from "./types";
import { styled } from "styled-components";

const SOCKET_URL = "http://localhost:3000";
const PATH = "/ws/voting";

const Fullscreen = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: stretch;
  justify-content: center;
  background-color: #121212;
  padding: 0;
  margin: 0;
`;

const FormScreen: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [storedUsername, setStoredUsername] = useState<string>("");
  const [storedUserId, setStoredUserId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [voteValue, setVoteValue] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  // Socket states
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectError, setConnectError] = useState<string>("");
  const [connectionsCount, setConnectionsCount] = useState(0);

  // New: track if the user has successfully voted
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    // Load dynamic questions
    fetch("/dinamikus_form/questions.json")
      .then((res) => res.json())
      .then(setQuestions)
      .catch(() => setError("Hiba a kérdések betöltésekor."));
    // Load stored user info
    AsyncStorage.getItem("username").then((n) => n && setStoredUsername(n));
    AsyncStorage.getItem("id").then((i) => {
      if (i) {
        setStoredUserId(i);
        setUserId(i);
      }
    });
    setLoading(false);
  }, []);

  const handleConnect = () => {
    setConnectError("");
    const sock = io(SOCKET_URL, {
      path: PATH,
      transports: ["websocket"],
      query: { role: "voter", userId: storedUserId },
    });
    setSocket(sock);

    sock.on("connect", () => {
      setConnected(true);
    });

    sock.on("connectionCount", (p: { count: number }) =>
      setConnectionsCount(p.count)
    );

    // Listen for vote success to show thank-you
    sock.on("voteSuccess", () => {
      console.log("Received voteSuccess");
      setVoted(true);
    });

    sock.on("disconnect", () => setConnected(false));

    sock.on("error", (m: string) => {
      setConnectError(m);
      sock.disconnect();
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!connected) return setError("Előbb csatlakozz a szavazáshoz!");
    if (!voteValue) return setError("Válassz egy jelöltet!");
    setSubmitting(true);

    // Emit the vote; wait for 'voteSuccess' event
    socket!.emit("castVote", {
      userId: parseInt(userId, 10),
      voteValue,
    });

    // don’t reset state here; wait for voteSuccess
    setSubmitting(false);
  };

  if (loading)
    return (
      <Container>
        <Loader>Űrlap betöltése…</Loader>
      </Container>
    );

  return (
    <Fullscreen>
      <Frame>
        <p>
          Bejelentkezve mint: <strong>{storedUsername}</strong>
        </p>

        {/* If already voted, show thank-you */}
        {voted ? (
          <h3 style={{ color: "#bb86fc" }}>Köszönjük a szavazatodat!</h3>
        ) : (
          <>
            {/* Connect UI */}
            {!connected && !connectError ? (
              <SubmitButton onClick={handleConnect}>
                Csatlakozás a szavazáshoz
              </SubmitButton>
            ) : (
              <p>Kapcsolódva ({connectionsCount} fő)</p>
            )}
            {connectError && <p style={{ color: "#e91e63" }}>{connectError}</p>}
            {error && <p style={{ color: "#bb86fc" }}>{error}</p>}

            {/* Voting form */}
            {connected && !connectError && (
              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label>Válassz jelöltet:</Label>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <label>
                      <Input
                        type="radio"
                        name="voteValue"
                        value="george-simion"
                        checked={voteValue === 1}
                        onChange={(e) => setVoteValue(1)}
                      />{" "}
                      George Simion
                    </label>
                    <label>
                      <Input
                        type="radio"
                        name="voteValue"
                        value="nicusor-dan"
                        checked={voteValue === -1}
                        onChange={(e) => setVoteValue(-1)}
                      />{" "}
                      Nicușor Dan
                    </label>
                  </div>
                </FormGroup>

                {questions.map((q, i) => (
                  <FormGroup
                    key={q.name}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <Label htmlFor={q.name}>{q.label}</Label>
                    <Input
                      id={q.name}
                      name={q.name}
                      type={q.type}
                      value={values[q.name] || ""}
                      onChange={(e) =>
                        setValues((p) => ({ ...p, [q.name]: e.target.value }))
                      }
                      required={q.required}
                    />
                  </FormGroup>
                ))}

                <SubmitButton type="submit" disabled={submitting}>
                  {submitting ? "Küldés…" : "Küldés"}
                </SubmitButton>
              </Form>
            )}
          </>
        )}
      </Frame>
    </Fullscreen>
  );
};

export default FormScreen;
