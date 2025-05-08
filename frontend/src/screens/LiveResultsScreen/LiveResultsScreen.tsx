// src/screens/LiveResultsScreen/LiveResultsScreen.tsx
import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import styled from "styled-components";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Loader } from "../FormScreen/styles";

// Constants
const SOCKET_URL = "http://localhost:3000";
const PATH = "/ws/voting";

// Candidate mapping
const CANDIDATES: Record<string, string> = {
  "george-simion": "George Simion",
  "nicusor-dan": "Nicușor Dan",
};

// Styled components
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

const Card = styled.div`
  flex: 1;
  background-color: #1e1e1e;
  border-radius: 8px;
  margin: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  margin-bottom: 1rem;
  color: #e0e0e0;
  h2 {
    margin: 0;
    font-size: 1.5rem;
  }
  p {
    margin: 0.25rem 0;
  }
`;

const ChartWrapper = styled.div`
  flex: 1;
  width: 100%;
`;
// Candidate mapping
// Candidate mapping for voteCounts
const VOTE_LABELS: Record<string, string> = {
  positiveVotes: "George Simion",
  negativeVotes: "Nicușor Dan",
};

export const LiveResultsScreen: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionCount, setConnectionCount] = useState(0);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const sock = io(SOCKET_URL, {
      path: PATH,
      transports: ["websocket"],
      query: { role: "viewer" },
    });
    setSocket(sock);

    sock.on("connect", () => {
      console.log("LiveResults: connected", sock.id);
      setConnected(true);
      setLoading(false);
    });

    sock.on("disconnect", () => {
      console.log("LiveResults: disconnected");
      setConnected(false);
    });

    sock.on("connectionCount", (payload: { count: number }) => {
      console.log("LiveResults: connectionCount", payload.count);
      setConnectionCount(payload.count);
    });

    sock.on("voteCounts", (counts: Record<string, number>) => {
      console.log("LiveResults: voteCounts", counts);
      setVoteCounts(counts);
    });

    sock.on("error", (msg: string) => {
      console.error("LiveResults socket error:", msg);
      setError(msg);
    });

    return () => {
      sock.close();
    };
  }, []);

  // Map counts to chart data with friendly names
  const chartData = Object.entries(voteCounts).map(([key, count]) => ({
    name: VOTE_LABELS[key] || key,
    count,
  }));

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
        <Header>
          <h2>Élő szavazati eredmények</h2>
          <p>Kapcsolódva: {connected ? "Igen" : "Nem"}</p>
          <p>Aktív szavazók: {connectionCount}</p>
          {error && <p style={{ color: "#e91e63" }}>{error}</p>}
        </Header>
        <ChartWrapper>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: "#e0e0e0" }} />
              <YAxis tick={{ fill: "#e0e0e0" }} />
              <Tooltip
                wrapperStyle={{ backgroundColor: "#2c2c2c", border: "none" }}
                labelStyle={{ color: "#e0e0e0" }}
                itemStyle={{ color: "#e0e0e0" }}
              />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </Card>
    </Fullscreen>
  );
};

export default LiveResultsScreen;
