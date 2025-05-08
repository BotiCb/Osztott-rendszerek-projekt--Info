// src/screens/FormScreen/styles.ts
import styled, { keyframes } from "styled-components";

const pulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50%       { opacity: 1;   }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0);    }
`;

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  min-height: 100vh;
  background-color: #121212;
  color: #e0e0e0;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
`;

export const Loader = styled.div`
  font-size: 1.2rem;
  color: #9e9e9e;
  animation: ${pulse} 1.5s infinite ease-in-out;
`;

export const Frame = styled.div`
  display: inline-block;
  padding: 1.5rem;
  margin-top: 1rem;
  border: 2px solid #bb86fc;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  background-clip: padding-box;
`;

export const Form = styled.form`
  width: 100%;
  max-width: 480px;
  background-color: #1e1e1e;
  padding: 2rem;
  border-radius: 6px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
`;

export const FormGroup = styled.div`
  margin-bottom: 1.5rem;
  animation: ${fadeInUp} 0.4s forwards;
`;

export const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #9e9e9e;
`;

export const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #3c3c3c;
  border-radius: 4px;
  background-color: #2a2a2a;
  color: #e0e0e0;
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:focus {
    outline: none;
    border-color: #bb86fc;
    box-shadow: 0 0 0 3px rgba(187, 134, 252, 0.2);
  }
`;

export const SubmitButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  margin-top: 1rem;
  background-color: #6200ee;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.1s ease;

  &:hover {
    background-color: #3700b3;
  }
  &:active {
    transform: scale(0.97);
  }
`;
