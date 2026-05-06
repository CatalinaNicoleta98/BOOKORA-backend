import mongoose from "mongoose";
import { envConfig } from "./env";

export async function testConnection(){
    try {
        await connect();
        console.log("Database connection test successful");
    }catch(error){
        console.log("Database connection test failed:" + error);

    }
}


export async function connect(){

    // If already connected, do nothing
    if (mongoose.connection.readyState === 1) {
        return;
    }

    try {
        await mongoose.connect(envConfig.dbHost);

        if(mongoose.connection.db){
            await mongoose.connection.db.admin().command({ping: 1});
            console.log("Connected successfully to the database");
        }else{
            throw new Error("Database connection is not established");
        }

    }catch (error){
        console.log("Error connecting to the database:" + error);
        throw error;
    }
};


export async function disconnect(){
    try {
        // If not connected, nothing to do
        if (mongoose.connection.readyState !== 1) {
            return;
        }
        await mongoose.disconnect();
        console.log("Disconnected successfully from the database");

    }catch (error){
        console.log("Error disconnecting from the database:" + error);
        throw error;
    }
}
