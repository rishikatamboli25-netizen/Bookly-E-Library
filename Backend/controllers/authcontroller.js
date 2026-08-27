// import {User} from "../models/User.js"
import mongoose from "mongoose";
import User from "../models/User.js";
import jwt from 'jsonwebtoken'
import "dotenv/config";

export const registerUser = async (req, res) =>{
    try{
        const {username, email } = req.body;
        let user = await User.findOne({email});

        if(!user) {
            user = await User.create({
                username,
                email,
            });
        }


        const token = jwt.sign(
            {
                userId: user._id,
            },
            process.env.jwt_SECERT,
        );


        res.status(200).json({
            message: "Authentication successfully",
            token,
            user:{
                id: user._id,
                username: user.username,
                email: user.email,
            }
            
        });
    }catch (error) {
        console.error("error: ", error);

        res.status(500).json({
            message: "internal server error"
        });
    }
};


export const deleteUser = (req,res)=>{
    res.send(200).json({
        message:"Deleting User"
    })
}

export const checkUser = async (req,res)=>{
   try{
    const {email} = req.body;

    if(!email) {
        return res.status(400).json({
            message: "Email is required"
        });
    }

    const user = await User.findOne({ email });
    return res.status(200).json({
        exists: !!user,
    });
   } catch(error){
    console.error("checkEmail:", error);
    return res.status(500).json({
        message: "internal server error",
    })
   }
}

