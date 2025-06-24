import { User } from "../models/users.model.js";
import { Meeting } from "../models/meeting.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import httpStatus from "http-status";


const login = async (req,res) => {
    const {username,password} = req.body;
    if(!username || !password){
        return res.status(400).json({message:"please provide"})
    }
    try{
        const user = await User.findOne({username});
        if(!user){
            return res.status(httpStatus.NOT_FOUND).json({message:"user not found"})
        }

        const isPasswordCorrect = await bcrypt.compare(password,user.password);
        
        if(isPasswordCorrect){
            const token = crypto.randomBytes(20).toString("hex");
            user.token = token;
            await user.save();
            return res.status(httpStatus.OK).json({token:token})
        }
        else{
            return res.status(httpStatus.UNAUTHORIZED).json({message:"invalid credentials"})
        }
    }
    catch(err){
        return res.status(500).json({message:`something is wrong ${err}`})
    }
}

const register = async (req,res) => {
    const {name,username,password}  = req.body;
    console.log(username);
    console.log(name);
    console.log(password);
    try{
        const existingUser = await User.findOne({username});
        if(existingUser){
            return res.status(httpStatus.FOUND).json({message:"user already exists"})
        }
        const hashedPassword = await bcrypt.hash(password,10);
        console.log(hashedPassword);
        const newUser = new User({
            name:name,
            username:username,
            password:hashedPassword
        })
        await newUser.save();
        res.status(httpStatus.CREATED).json({message:"user registered"})
    }
    catch(err){
        res.json({message:`something went wrong ${err} `})
    }

}


const getUserHistory = async(req,res) => {
    const {token} = req.query;

    try{
        const user = await User.findOne({token:token})
        const meetings = await Meeting.find({user_id:user.username})
        res.json(meetings)
    }
    catch(error){
        res.json({message : `something went wrong ${error}`})
    }
}

const addToUserHistory = async(req,res) => {
    const   {token,meeting_code} = req.body;

    try{
        const user = await User.findOne({token:token})

        const newMeeting = await Meeting({
            user_id:user.username,
            meeting_code:meeting_code
        })
        await newMeeting.save();

        res.status(httpStatus.CREATED).json({message:"Added code to the history"})
    }
    catch(error){
        res.json({message : `something went wrong ${error}`})
    }
}


export {login,register,getUserHistory,addToUserHistory}