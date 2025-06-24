import React, { useRef, useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { io } from "socket.io-client";
import '../styles/VideoMeet.css';
import { color, height } from '@mui/system';
import { useNavigate } from "react-router";

import IconButton from '@mui/material/IconButton';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';

import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'; // or ScreenShareOffIcon
import { Badge } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';





const server_url = "http://localhost:8000";

const connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

export default function VideoMeet() {
  const socketRef = useRef();
  const socketIdRef = useRef();
  const localVideoRef = useRef();

  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [video, setVideo] = useState([]);
  const [audio, setAudio] = useState(true);
  const [screen, setScreen] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [screenAvailable, setScreenAvailable] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [newMessages, setNewMessages] = useState(1);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");

  const videoRef = useRef([]);
  let [videos, setVideos] = useState([])

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoPermission) setVideoAvailable(true);

      const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioPermission) setAudioAvailable(true);

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      }

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });

        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (err) {
      console.error("Error getting permissions:", err);
    }
  };

  useEffect(() => {
    getPermissions();
  }, []);

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [audio, video]);

  const gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
          if (signal.sdp.type === "offer") {
            connections[fromId].createAnswer().then((description) => {
              connections[fromId].setLocalDescription(description).then(() => {
                socketRef.current.emit("signal", fromId, JSON.stringify({ "sdp": connections[fromId].localDescription }));
              }).catch(e => console.log(e));
            }).catch(e => console.log(e));
          }
        }).catch(e => console.log(e));
      }
      if (signal.ice) {
        connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
      }
    }
  };

  const addMessage = (data, sender, socketIdSender) => {

    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data }
    ])

    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevMessages) => prevMessages + 1)
    }

  };

  const connectTosocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on('signal', gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

          connections[socketListId].onicecandidate = (event) => {
            if (event.candidate != null) {
              socketRef.current.emit("signal", socketListId, JSON.stringify({ "ice": event.candidate }));
            }
          };

          connections[socketListId].onaddstream = (event) => {
            let videoExists = videoRef.current.find(video => video.socketId === socketListId);
            if (videoExists) {
              setVideos(videos => {
                const updatedVideos = videos.map(video =>
                  video.socketId === socketListId ? { ...video, stream: event.stream } : video
                );
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            } else {
              const newVideo = {
                socketId: socketListId,
                stream: event.stream,
                autoplay: true,
                playsInline: true
              };
              setVideos(videos => {
                const updatedVideos = [...videos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            }
          };

          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            connections[socketListId].addStream(window.localStream);
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;
            try {
              connections[id2].addStream(window.localStream);
            } catch (e) {
              connections[id2].createOffer().then((description) => {
                connections[id2].setLocalDescription(description).then(() => {
                  socketRef.current.emit("signal", id2, JSON.stringify({
                    "sdp": connections[id2].localDescription
                  }));
                }).catch(e => console.log(e));
              });
            }
          }
        }
      });
    });
  };

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  }

  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), { width, height });
    canvas.getContext('2d').fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  }

  const getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach(track => track.stop()); // 
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      connections[id].addStream(window.localStream);
      connections[id].createOffer().then((description) => {
        connections[id].setLocalDescription(description).then(() => {
          socketRef.current.emit("signal", id, JSON.stringify({ // ✅ Fix 2
            "sdp": connections[id].localDescription
          }));
        }).catch(e => console.log(e));
      });
    }

    stream.getTracks().forEach(track => track.onended = () => {
      setVideo(false);
      setAudio(false);
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      } catch (e) {
        console.log(e);
      }

      let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
      window.localStream = blackSilence();
      localVideoRef.current.srcObject = window.localStream;

      for (let id in connections) {
        connections[id].addStream(window.localStream);
        connections[id].createOffer().then((description) => {
          connections[id].setLocalDescription(description).then(() => {
            socketRef.current.emit("signal", id, JSON.stringify({ // ✅ Fix 3
              "sdp": connections[id].localDescription
            }));
          }).catch(e => console.log(e));
        });
      }
    });
  };

  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices.getUserMedia({
        video: video,
        audio: audio
      })
        .then((stream) => {
          getUserMediaSuccess(stream);
        })
        .catch((e) => console.error("getUserMedia error:", e));
    } else {
      try {
        let tracks = localVideoRef.current?.srcObject?.getTracks();
        tracks?.forEach(track => track.stop());
      } catch (e) {
        console.error("Error stopping tracks:", e);
      }
    }
  };

  const getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectTosocketServer();
  };

  const connect = () => {
    setAskForUsername(false);
    getMedia();
  };

  let handleVideo = () => {
    setVideo(!video);
  }

  let handleAudio = () => {
    setAudio(!audio);
  }

  let getDisplayMediaSuccess = (stream) => {
    try {
      window.localStream?.getTracks().forEach(track => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);
      connections[id].createOffer()
        .then((description) => {
          connections[id].setLocalDescription(description)
            .then(() => {
              socketRef.current.emit("signal", id, JSON.stringify({
                sdp: connections[id].localDescription
              }));
            })
            .catch((e) => {
              console.log(e);
            });
        })
        .catch((e) => {
          console.log(e);
        });
    }

    stream.getTracks().forEach(track => track.onended = () => {
      setScreen(false)
      try {
        let tracks = localVideoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      } catch (e) {
        console.log(e);
      }

      let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
      window.localStream = blackSilence();
      localVideoRef.current.srcObject = window.localStream;

      getUserMedia();
    });
  };



  let getDisplayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        })
          .then(getDisplayMediaSuccess)
          .then((stream) => {

          })
          .catch(
            (e) => {
              console.log(e)
            }
          )
      }
    }
  }

  useEffect(() => {
    if (screen !== undefined) {
      getDisplayMedia();
    }
  }, [screen])

  let handleScreen = () => {
    setScreen(!screen);
  }

  let sendMessage = () => {
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  }

  let RouteTo = useNavigate();

  let handleEndCall = () => {
    try {
      let tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    catch (e) {
      console.log(e)
    }
    alert("your call was ended")

    RouteTo("/home");
  }


  return (
    <div>
      {askForUsername ? (

        <div className='meetingRoomEntry'>

          <div>
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
            <h3 style={{ fontFamily: "Michroma", marginBottom: "20px", color: "white" }}>Enter into Lobby</h3>
            <TextField
              id="outlined-basic"
              label="Username"
              value={username}
              onChange={event => setUsername(event.target.value)}
              variant="outlined"
              InputProps={{
                style: { color: "white" }
              }}
              InputLabelProps={{
                style: { color: "white" }
              }}
            />

            <Button variant="contained" onClick={connect}>Connect</Button>

            <div >
              <video ref={localVideoRef} autoPlay muted playsInline></video>
            </div>
          </div>
        </div>
      ) : (
        <div className='meetVideoContainer'>

          {
            showModal ?
              <div className='chatRoom'>

                <div className='chatContainer'>
                  <h2 style={{ fontFamily: "Michroma" }}>Kanectu-Chat</h2>
                  <div className="chattingDisplay">
                    {messages.map((item, index) => {
                      return (
                        <div key={index} style={{ marginBottom: "20px" }} className='chattingInfo'>
                          <p style={{ fontWeight: "bold", fontFamily: "Michroma", color: "yellow" }}>{item.sender}</p>
                          <p>{item.data}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="chattingArea">
                    <TextField id="outlined-basic" label="Message here.." variant="outlined" onChange={(e) => setMessage(e.target.value)} value={message} />
                    <Button variant="contained" onClick={sendMessage}>Send</Button>
                  </div>

                </div>
              </div> : <> No Messages Yet</>
          }


          <div className='buttonContainers'>

            <IconButton style={{ color: "gray" }} onClick={handleVideo}>
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>
            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>
            <IconButton style={{ color: "gray" }} onClick={handleAudio}>
              {audio ? <MicIcon></MicIcon> : <MicOffIcon></MicOffIcon>}
            </IconButton>
            <IconButton style={{ color: "gray" }} onClick={handleScreen}>
              {screenAvailable ? <ScreenShareIcon /> : <StopScreenShareIcon />}
            </IconButton>

            <Badge badgeContent={newMessages} max={999} color="secondary">
              <IconButton style={{ color: "gray" }} onClick={() => { setShowModal(!showModal) }}>
                <ChatIcon />
              </IconButton>
            </Badge>


          </div>
          <video ref={localVideoRef} className='meetUserVideo' autoPlay muted></video>
          <div className='conferenceView'>

            {videos.map((video) => (
              <video
                key={video.socketId}
                data-socket={video.socketId}
                ref={(ref) => {
                  if (ref && video.stream) {
                    ref.srcObject = video.stream;
                  }
                }}
                autoPlay
              />
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
