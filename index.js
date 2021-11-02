import express from 'express';
import redis from 'redis';
import session from 'express-session';
import cRedis from 'connect-redis';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import db from './db';

const redisStore = cRedis(session);
const client = redis.createClient();
const app = express();
const PORT = process.env.PORT || 4001;

/**
 * Middleware
 */
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/public"));

/**
 * Handle CORS Requirements - preset for local development
 */
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD'],
    credentials: true
}))

/**
 * Session management with Redis
 */
app.use(session({
    secret: process.env.PROD_SECRET || 'replacewithrandomsecretinproduction',
    cookie: { maxAge: 300000000, secure: false }, //set secure to true in Production
    store: new redisStore({ host: 'localhost', port: 6379, client: client, ttl: 260 }),
    saveUninitialized: false,
    resave: false
}))

app.use(passport.initialize());
app.use(passport.session());

/**
 * Passport Setup
 */
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Update DB methods for your use case
passport.deserializeUser((id, done) => {
    db.users.findById(id, function (err, user) {
        if (err) return done(err)
        done(null, user);
    });
});

// Update DB methods for your use case
passport.use(
    new LocalStrategy(function (username, password, cb) {
        db.users.findByUsername(username, function (err, user) {
            if (err) {
                return cb(err);
            }
            if (!user) {
                return cb(null, false);
            }
            if (user.password != password) {
                return cb(null, false);
            }
            return cb(null, user);
        });
    })
);

/**
 * Routes
 */

// Complete the logut handler below:
app.get("/logout", (req, res) => {
    req.logout();
    res.redirect('/login');
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post(
    "/login",
    passport.authenticate("local", { failureRedirect: "/login" }),
    (req, res) => {
        res.redirect("profile");
    }
);

app.get("/profile", (req, res) => {
    res.render("profile", { user: req.user });
});

app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const newUser = await db.users.createUser({ username, password });
    if (newUser) {
        res.status(201).json({
            msg: "New user created!",
            newUser,
        });
    } else {
        res.status(500).json({ msg: "Unable to create user" });
    }
});

/**
 * Listen
 */
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});