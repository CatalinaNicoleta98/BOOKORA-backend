import express, { Application } from 'express';
import dotenvFlow from 'dotenv-flow';
import routes from './routes';
import { testConnection } from './config/db';
import cors from 'cors';

import path from 'path';


dotenvFlow.config();

//create express application
const app: Application = express();

//cors handling

function setupCors() {
    app.use(cors({
        origin: ['http://localhost:5173', 'http://localhost:5174'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowedHeaders: ['Authorization', 'auth-token', 'Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
        credentials: true
    }));
}

//JSON body parser middlerware
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Setup CORS middleware before routes
setupCors();

app.use('/api', routes);

export function startServer(){
   const PORT: number = parseInt(process.env.PORT as string) || 4000;

    app.listen(PORT, function(){
        console.log("Server is up and running on port:" + PORT);
    });

    // Keep startup resilient even if the database is temporarily unavailable
    void testConnection();
}
