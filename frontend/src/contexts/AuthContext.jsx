import { createContext, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import httpStatus from "http-status";
import server from '../environment'

// Create AuthContext
export const AuthContext = createContext({});

// Axios instance with proper baseURL
const client = axios.create({
    baseURL: `${server.prod}//loc/api/v1/users`
});

// AuthProvider component
export const AuthProvider = ({ children }) => {
    const authContext = useContext(AuthContext);
    const [userData, setUserData] = useState(authContext);
    const router = useNavigate();

    // Handle user registration
    const handleRegister = async (name, username, password) => {
        try {
            const request = await client.post("/register", {
                name,
                username,
                password
            });

            if (request.status === httpStatus.CREATED) {
                return request.data.message;
            }
        } catch (err) {
            throw err;
        }
    };

    // Handle user login
    const handleLogin = async (username, password) => {
        try {
            const request = await client.post("/login", {
                username,
                password
            });

            if (request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token);
                
                // Example navigation after login (optional):
                // router("/dashboard");
            }
        } catch (err) {
            throw err;
        }
    };

    const getHistoryOfUser = async() => {
        try{
            let request = await client.get("/get_all_activity",{
                params: {
                    token:localStorage.getItem("token")
                }
            })
            return request.data;

        }
        catch(e){
            throw e;
        }
    }

    const addToUserHistory = async(meetingCode) => {
        try{
            let request = await client.post("/add_to_activity",{
                token:localStorage.getItem("token"),
                meeting_code:meetingCode
            })
            return request

        }
        catch(error){
            throw error;
        }
    }

    // Context data
    const data = {
        userData,
        setUserData,
        handleRegister,
        handleLogin,
        getHistoryOfUser,
        addToUserHistory
    };

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
};
