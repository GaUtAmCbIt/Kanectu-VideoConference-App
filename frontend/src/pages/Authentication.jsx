import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const defaultTheme = createTheme();

export default function Authentication() {
  const [username, setUsername] = React.useState();
  const [password, setPassword] = React.useState();
  const [name, setName] = React.useState();
  const [error, setError] = React.useState();
  const [message, setMessage] = React.useState();
  const [formState, setFormState] = React.useState(1);
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const {handleRegister,handleLogin} = React.useContext(AuthContext);
  let handleAuth = async() => {
    try{
      if(formState ===0){
        let result = await handleLogin(username,password);
        console.log(result);
        setMessage(result);
        setOpen(true);
        setError("")
      }
      if(formState ===1){
        let result = await handleRegister(name,username,password);
        console.log(result);
        setMessage(result);
        setOpen(true);
        setFormState(0)
        setPassword('')
        setUsername('')
        setError("");
        
        
      }
    }
    catch(err){
      let message = (err.response.data.message);
      setError(message);
    }
    navigate("/home")
  }

  return (
    <>
    
    <ThemeProvider theme={defaultTheme}>
      <Grid
        container
        component="main"
        sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        
        <CssBaseline />
        <Grid item xs={10} sm={8} md={5} component={Paper} elevation={10} square>
          <Box
            sx={{
              my: 4,
              mx: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
              <LockOutlinedIcon />
            </Avatar>

            <div>
  <Button variant={formState === 0 ? "contained" : "outlined"} onClick={() => setFormState(0)} style={{marginRight:"1.2rem"}}>
    Login
  </Button>
  <Button variant={formState === 1 ? "contained" : "outlined"} onClick={() => setFormState(1)}>
    Register
  </Button>
</div>


            <Box component="form" noValidate sx={{ mt: 1, width: '100%' }}>
              
            { formState===1 ? <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Full name"
                name="name"
                autoComplete="name"
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
              /> : ""}
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                value={password}
                autoComplete="password"
                onChange={(event) => setPassword(event.target.value)}
              />

              <p style={{color:"red"}}>*{error}</p>
              
              <Button
                type="button"
                fullWidth
                variant="contained"
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  fontWeight: 'bold',
                  background: 'linear-gradient(to right, #1976d2, #2196f3)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',

                }
              }
              onClick={handleAuth}
              >
                {formState === 0 ? "Login" : "Register"}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Snackbar 
      open={open}
      autoHideDuration={4000}
      message={message}
      ></Snackbar>
    </ThemeProvider>
    </>
  );
}
