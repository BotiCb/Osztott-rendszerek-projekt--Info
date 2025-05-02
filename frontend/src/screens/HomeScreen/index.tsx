// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import './styles.css';

// const HomeScreen = () => {
//   const navigate = useNavigate();

//   return (
//     <div className="home-container">
//       <h1>Szavazó Rendszer</h1>
//       <button onClick={() => navigate('/vote')}>Szavazás</button>
//       <button onClick={() => navigate('/results')}>Eredmények</button>
//     </div>
//   );
// };

// export default HomeScreen;


import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styles.css';

const HomeScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="home-wrapper">
      <nav className="navbar">
        <div className="logo">Szavazó Rendszer</div>
        <div className="nav-links">
          <button onClick={() => navigate('/vote')}>Űrlapok</button>
          <button onClick={() => navigate('/results')}>Eredmények</button>
        </div>
      </nav>
      <main className="main-content">
        <h2>Üdvözöllek a szavazófelületen!</h2>
        <p>Kérlek válassz a fenti menüből egy műveletet.</p>
      </main>
    </div>
  );
};

export default HomeScreen;
