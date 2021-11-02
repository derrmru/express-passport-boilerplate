import express from 'express';
import redis from 'redis';
import session from 'express-session';
import cRedis from 'connect-redis';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

const redisStore = cRedis(session);
const client = redis.createClient();
const app = express();
const PORT = process.env.PORT || 4001;

/**
 * Middleware
 */

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/public"));

/**
 * Session management with Redis
 */
app.use(session({
    secret: process.env.PROD_SECRET || 'replacewithrandomsecretinproduction',
    store: new redisStore({ host: 'localhost', port: 6379, client: client, ttl: 260 }),
    saveUninitialized: false,
    resave: false
}))