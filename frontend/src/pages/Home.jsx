import React from 'react';
import isAuth from '../utils/isAuth'
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import "../App.css"
import { Button, IconButton } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';

import TextField from '@mui/material/TextField';
import { AuthContext } from '../contexts/AuthContext';
import { useContext } from 'react';

function Home() {


  let navigate = useNavigate();

  const [meetingCode, setMeetingCode] = useState('');
  const {addToUserHistory} = useContext(AuthContext);


  let handleJoinVideoCall = async () => {
    await addToUserHistory(meetingCode)
    navigate(`/${meetingCode}`)
  }
  return (
    <>
      <div className='navBar'>
        <div style={{ display: "flex", "alignItems": "center" }}>

          <h3
            style={{
              fontFamily: "Michroma",
              background: "linear-gradient(to right, orange, white, green)",
              WebkitBackgroundClip: "text",
              color: "transparent"
            }}
          >
            Kanectu.
          </h3>

        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <IconButton>
            <RestoreIcon style={{ color: "white" }}></RestoreIcon><p style={{ color: "white", marginRight: '10px' }} onClick={() => {
              navigate("/history")
            }}> History</p>
          </IconButton>
          <Button onClick={() => {
            localStorage.removeItem("token")
            navigate("/auth")
          }}>Logout</Button>

        </div>
      </div>
      <div className='meetContainer'>
        <div className='leftPanel'>
          <div>
            <h2>Providing Immaculate Quality Video Call</h2>
            <div style={{ display: "flex", gap: "10px" }}>

              <TextField onChange={event => setMeetingCode(event.target.value)}
                id="outlined-basic" label="Meeting Code" variant='outlined'></TextField>
              <Button onClick={handleJoinVideoCall} variant='contained'>Join</Button>

            </div>
          </div>
        </div>
        <div className='rightPanel'>
          <img src='undraw_group-video_k4jx.png' style={{ width: "40vw" }}></img>
        </div>
      </div>
    </>
  )
}

export default isAuth(Home);
