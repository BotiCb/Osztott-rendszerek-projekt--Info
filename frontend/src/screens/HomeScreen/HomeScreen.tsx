// src/screens/HomeScreen/HomeScreen.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Wrapper,
  FullscreenCard,
  Title,
  ButtonGrid,
  ActionButton,
} from "./styles";

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Wrapper>
      <FullscreenCard>
        <Title>Szavazó Rendszer</Title>
        <ButtonGrid>
          <ActionButton onClick={() => navigate("/voter-list")}>
            Szavazók listája
          </ActionButton>
          <ActionButton onClick={() => navigate("/live-results")}>
            Szavazat állása
          </ActionButton>
          <ActionButton onClick={() => navigate("/login")}>
            Bejelentkezés
          </ActionButton>
        </ButtonGrid>
      </FullscreenCard>
    </Wrapper>
  );
};

export default HomeScreen;
