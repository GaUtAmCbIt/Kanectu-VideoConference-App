import React from 'react'
import '../App.css';
import { Link, useNavigate } from 'react-router-dom';

export default function LandingPage() {

  const routerTo = useNavigate();
  return (
    <div className='landingPageContainer'>

      <nav>
        <div className='navHeader'>
          <h2
            style={{
              fontFamily: "Michroma",
              background: "linear-gradient(to right, orange, white, green)",
              WebkitBackgroundClip: "text",
              color: "transparent"
            }}
          >
            Kanectu.
          </h2>






        </div>
        <div className='navList'>
          <p onClick={() => {routerTo("/kanectu")}}>Join as Guest</p>
          <p onClick={() => {routerTo("/auth")}}>Register</p>
          <div role='button'>
            <p onClick={() => {routerTo("/auth")}}>Login</p>
          </div>
        </div>
      </nav>
      <div className="landingMainContainer">
        <div>
          <h1><span style={{ "color": "#d97500" }}>Connect</span> with your Loved Ones.</h1>
          <p>Cover a distance by <p style={{ fontFamily: "Michroma" }}>Kanectu.</p></p>
          <div role="button">
            <Link to='/auth'>Get Started</Link>
          </div>
        </div>

        <div>
          <img src='/mobile.png' alt='Mobile' />
        </div>

      </div>
    </div>

  )
}

