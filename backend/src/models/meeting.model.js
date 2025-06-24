import { Schema } from "mongoose";
import mongoose from "mongoose";



const meetingSchema = new Schema({
    user_id:{
        type:String,
        
    },
    meeting_code:{
        type:String,
        required:true,
        
    },
    date:{
        type:Date,
        required:true,
        default:Date.now,
        required:true
    },
    
});

const Meeting = mongoose.model("Meeting",meetingSchema);

export {Meeting}; // default pe hum ek hi cheez export karsakte hain