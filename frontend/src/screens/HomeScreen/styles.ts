// src/screens/HomeScreen/styles.ts
import styled from "styled-components";

export const Wrapper = styled.div`
  background: linear-gradient(135deg, #1f1c2c 0%, #28243d 100%);
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/** Now fills the entire screen, no rounded corners */
export const FullscreenCard = styled.div`
  background: rgba(30, 30, 30, 0.95);
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
`;

export const Title = styled.h1`
  color: #ffffff;
  font-size: 2.5rem;
  margin-bottom: 2.5rem;
  font-weight: 600;
`;

export const ButtonGrid = styled.div`
  display: grid;
  gap: 1rem;
  width: 100%;
  max-width: 400px;
`;

export const ActionButton = styled.button`
  background: linear-gradient(135deg, #ff6ec4 0%, #7873f5 100%);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 1rem;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.6);
  }
  &:active {
    transform: translateY(0);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  }
`;
