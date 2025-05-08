// src/screens/VoterListScreen/VoterListScreen.tsx
import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import {
  Fullscreen,
  Card,
  Title,
  List,
  ListItem,
  Avatar,
  VoterInfo,
} from "./styles";
import { Loader } from "../FormScreen/styles";

export const VoterListScreen: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [voters, setVoters] = useState<{ userId: number; username: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const sock = io("http://localhost:3000", {
      path: "/ws/voting",
      transports: ["websocket"],
      query: { role: "viewer" },
    });
    setSocket(sock);

    sock.on("connect", () => setLoading(false));
    sock.on("voterList", (list) => setVoters(list));
    sock.on("error", (msg) => setError(msg));
    return () => sock.disconnect();
  }, []);

  if (loading) {
    return (
      <Fullscreen>
        <Loader>Betöltés…</Loader>
      </Fullscreen>
    );
  }

  return (
    <Fullscreen>
      <Card>
        <Title>Valósidejű szavazók</Title>
        {error && <p style={{ color: "#e91e63" }}>{error}</p>}

        <List>
          {voters.length === 0 && <li>– nincs még szavazat –</li>}
          {voters.map((v, idx) => (
            <ListItem key={v.userId} index={idx}>
              <Avatar>
                {v.username
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </Avatar>
              <VoterInfo>
                <span>{v.username}</span>
                <span>ID: {v.userId}</span>
              </VoterInfo>
            </ListItem>
          ))}
        </List>
      </Card>
    </Fullscreen>
  );
};

export default VoterListScreen;
