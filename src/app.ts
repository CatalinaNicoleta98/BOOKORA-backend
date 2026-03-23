import express, {Application, Request, Response} from 'express';
import dotenvFlow from 'dotenv-flow';
import routes from './routes';
import { testConnection } from './config/db';
import test from 'node:test';
import cors from 'cors';


dotenvFlow.config();

//create express application
const app: Application = express();

//cors handling

function setupCors() {
    app.use(cors({
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['auth-token', 'Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
        credentials: true
    }));
}

//JSON body parser middlerware
app.use(express.json());

// Setup CORS middleware before routes
setupCors();

app.use('/api', routes);

export function startServer(){


    // Test database connection before starting the server
    testConnection();

   const PORT: number = parseInt(process.env.PORT as string) || 4000;
    app.listen(PORT, function(){
        console.log("Server is up and running on port:" + PORT);
    });
}