// src/screens/VoterListScreen/styles.ts
import styled from "styled-components";

export const Fullscreen = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #121212;
  padding: 0;
  margin: 0;
`;

export const Card = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 2rem;
  color: #e0e0e0;
  /* Widened to 80% of viewport, max 1000px */
  width: 80vw;
  max-width: 1000px;
  /* allow vertical scrolling if too tall */
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5);
  overflow: hidden;
`;

export const Title = styled.h2`
  margin: 0 0 1rem;
  color: #bb86fc;
  font-size: 1.75rem;
  text-align: center;
`;

export const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  overflow-y: auto;
  width: 100%; /* ensure it fills the Card’s width */
`;

export const ListItem = styled.li<{ index: number }>`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #333;
  /* alternating background and full width */
  background-color: ${({ index }) => (index % 2 === 0 ? "#1e1e1e" : "#292929")};
  width: 100%;
  transition: background-color 0.2s ease;
  &:hover {
    background-color: #333;
  }
`;

export const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #bb86fc;
  color: #121212;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: bold;
  margin-right: 0.75rem;
  flex-shrink: 0;
`;

export const VoterInfo = styled.div`
  display: flex;
  flex-direction: column;
  & > span:first-child {
    font-weight: 600;
    color: #e0e0e0;
  }
  & > span:last-child {
    font-size: 0.85rem;
    color: #9e9e9e;
  }
`;
