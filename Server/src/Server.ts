import {env} from "../src/config/env.js"
import {app} from "./app.js";
import {prisma} from "../src/config/prisma.js"
import {logger} from "./config/logger.js";


const startServer=async()=>{
    try {
        await prisma.$connect();
        logger.info("Database connected !!")
        app.listen(env.PORT,()=>{
            logger.info("Server started!!")
            console.log(`Server starting on : http://localhost:${env.PORT}`)
        })
    } catch (error) {
        logger.error('Server error')
        await prisma.$disconnect();
        process.exit(1);
    }
}

startServer();

