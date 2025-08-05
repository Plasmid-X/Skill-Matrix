import dotenv from "dotenv";
dotenv.config();

export const config = {
  connection: { 
        port: parseInt(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST,
        ssl: {},
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null 
    },
}
