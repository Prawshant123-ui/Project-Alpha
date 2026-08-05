import {env} from "../src/config/env.js"
import {app} from "./app.js";
import {prisma} from "../src/config/prisma.js"
import {logger} from "./config/logger.js";
import { seedAdmin } from "./utils/seedAdmin.js";

const startServer=async()=>{
    try {
        await prisma.$connect();
        logger.info("Database connected !!")
        await seedAdmin()
        logger.info("Admin seeded successfully")
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

