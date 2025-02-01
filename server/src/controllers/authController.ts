import { Request, Response } from "express";
import { prisma } from "../server";
import bcrypt  from 'bcryptjs';
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';

const generateTokens=(userId:string,email:string,role:string)=>{
    const jwtSecret = process.env.JWT_SECRET; 
    if (!jwtSecret) { 
        throw new Error("JWT_SECRET is not defined"); 
    }
    const accessToken = jwt.sign({ userId, email, role }, jwtSecret, { expiresIn: "60m" }); 
    const refreshToken=uuidv4();
    return {accessToken,refreshToken
    }

}

const setTokens=(res:Response,accessToken:string,refreshToken:string)=>{
    res.cookie("accessToken",accessToken,{
        httpOnly:true,
        secure:process.env.NODE_ENV==="production",
        sameSite:"strict",
        maxAge:60*60*1000
    });
    res.cookie("refreshToken",refreshToken,{
        httpOnly:true,
        secure:process.env.NODE_ENV==="production",
        sameSite:"strict",
        maxAge:7*24*60*60
    });
    

}




const register=async(req:Request,res:Response):Promise<void>=>{
    try{
        const {name,email,password}=req.body;
        const existingUser=await prisma.user.findUnique({
            where:{email}
        })
        if(existingUser)
        {
            res.status(400).json({message:"Email is already Registered",success:false,error:true});
            return
        }
        const hashedPassword=await bcrypt.hash(password,12);
        const user=await prisma.user.create({
            data:{name,email,password:hashedPassword,role:"USER"}
        });
        res.status(200).json({message:"User Registered Successfully",success:true,error:false,userId:user.id})


    }
    catch(error)
    {
        console.error(error)
        res.status(500).json({message:"Registration failed",success:false,error:true})

    }
}

const login=async(req:Request,res:Response):Promise<void>=>{
try{
    const {email,password}=req.body;
    const extractCurrentUser=await prisma.user.findUnique({where:{email}})
if(!extractCurrentUser || !(bcrypt.compare(password,extractCurrentUser.password)))
{
    res.status(401).json({message:"Invalid credentials",success:false,error:true})
    return
}

//Create Access and Refresh Token
const {accessToken,refreshToken}=generateTokens(extractCurrentUser.id,extractCurrentUser.email,extractCurrentUser.role);


//set tokesns
await setTokens(res,accessToken,refreshToken
)
res.status(200).json({message:"User Login Success",success:true,error:false,data:{
    id:extractCurrentUser.id,
    name:extractCurrentUser.name,
    email:extractCurrentUser.email,
    role:extractCurrentUser.role
}})


}
catch(error)
{
    console.error(error);
    res.status(500).json({message:"Error in login",success:false,error:true})
}
}



const refreshAccessToken=async(req:Request,res:Response)=>{
    const refreshToken=req.cookies.refreshToken;
    if(!refreshToken)
    {
        res.status(401).json({message:"Invalid refresh Token",success:false,error:true})
    }
    try{
        const user=await prisma.user.findFirst({where:{refreshToken:refreshToken}})
if(!user)
{
    res.status(401).json({message:"Invalid refresh Token",success:false,error:true})
    return
}
const {accessToken,refreshToken:newRefreshToken}=generateTokens(user.id,user.email,user.role);
await setTokens(res,accessToken,newRefreshToken);
res.status(200).json({
    success: true,
    message: "Refresh token refreshed successfully",
    error:false
  });

    }
    catch(error)
    {
        console.error(error);
        res.status(500).json({message:"Refresh Token error",success:false,error:true})
    }
}


const logout=async(req:Request,res:Response)=>{
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({message:"User Logged Out Success",success:true,error:false})
}



export {register,login,refreshAccessToken,logout
}