import { env } from "../config/env.js"
import bcrypt from "bcrypt"
import { prisma } from "../config/prisma.js"
import { logger } from "../config/logger.js"

export const seedAdmin = async () => {
    try {
        const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, SALT_ROUNDS } = env
        if (!ADMIN_EMAIL || !ADMIN_NAME || !ADMIN_PASSWORD || !SALT_ROUNDS) {
            logger.error("Missing admin credentials!!")
            process.exit(1);
        }

        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS)

        const admin = await prisma.user.upsert({

            where: { email: ADMIN_EMAIL },
            update: {
                password: hashedPassword,
                name: ADMIN_NAME || "System Admin",
                role: "ADMIN",
            },
            create: {
                name: ADMIN_NAME || "System Admin",
                email: ADMIN_EMAIL,
                password: hashedPassword,
                role: "ADMIN",
            },
        })

        logger.info(`Admin seeded : ${admin.email}(role: ${admin.role})`)

    } catch (error) {
        logger.error(error)
        logger.error("Admin seeding failed!!")
        process.exit(1)

    }
}