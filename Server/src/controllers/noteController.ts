import type {Request,Response} from "express"
import {prisma} from "../config/prisma.js"
import {logger} from "../config/logger.js"
import {signToken,verifyToken} from "../utils/jwt.js"

const createNotes=async(req:Request,res:Response)=>{
    try {
        const {title,subject,description,domain,thumbnailImageUrl,videoUrl,notePdfUrl}=req.body

        

    } catch (error) {
        
    }
}
