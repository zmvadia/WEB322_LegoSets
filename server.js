/********************************************************************************



* WEB322 – Assignment 06

*

* I declare that this assignment is my own work in accordance with Seneca's

* Academic Integrity Policy:

*

* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html

*

* Name: Zainab Mustak Vadia Student ID: 119574234 Date: 16/08/2024

*

* Published URL:

*

********************************************************************************/
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const authData = require('./modules/auth-service');
const legoData = require('./modules/legoSets');
const Sequelize = require('sequelize');
const clientSessions = require('client-sessions');
const mongoose = require('mongoose');
const uri = process.env.MONGODB; 

if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const app = express();
const port = 8080;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(clientSessions({
    cookieName: 'session',
    secret: 'o6LjQ5EVNC28ZgK64hDELM18ScpFQr', // Ensure this is a secure random string
    duration: 2 * 60 * 1000, // Duration of the session in milliseconds
    activeDuration: 1000 * 60 // Session will be extended by this many ms each request
}));

function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        next();
    }
}

app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

app.get('/', (req, res) => {
    try {
        res.render('home', { page: 'home' });
    } catch (error) {
        res.status(500).render('500', { page: '500', message: 'Internal Server Error' });
    }
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/lego/sets', (req, res) => {
    if (req.query.theme) {
        legoData.getSetsByTheme(req.query.theme)
            .then(sets => res.render('sets', { sets: sets }))
            .catch(() => res.render('404', { page: '404', message: 'Set not found' }));
    } else {
        legoData.getAllSets()
            .then(sets => res.render('sets', { sets: sets }))
            .catch(() => res.render('404', { page: '404', message: 'Set not found' }));
    }
});

app.get('/lego/addSet', (req, res) => {
    legoData.getAllThemes()
       .then(themeData => res.render('addSet', { themes: themeData }))
       .catch(err => res.status(500).render('500', { message: `Error: ${err.message}` }));
});

app.post('/lego/addSet', ensureLogin, (req, res) => {
    legoData.addSet(req.body)
       .then(() => res.redirect('/lego/sets'))
       .catch(err => res.status(500).render('500', { message: `Error: ${err.message}` }));
});

app.get('/lego/editSet/:num', (req, res) => {
    const setNum = req.params.num;
    Promise.all([legoData.getSetByNum(setNum), legoData.getAllThemes()])
        .then(([setData, themeData]) => res.render('editSet', { themes: themeData, set: setData }))
        .catch(err => res.status(404).render('404', { message: `Error: ${err.message}` }));
});

app.post('/lego/editSet', ensureLogin, (req, res) => {
    const { set_num } = req.body;
    legoData.editSet(set_num, req.body)
        .then(() => res.redirect('/lego/sets'))
        .catch(err => res.status(500).render('500', { message: `Error: ${err.message}` }));
});

app.get('/lego/sets/:id', (req, res) => {
    legoData.getSetByNum(req.params.id)
        .then(setData => res.render('set', { set: setData }))
        .catch(() => res.render('404', { page: '404', message: 'Set not found' }));
});

app.get('/lego/deleteSet/:num', ensureLogin, (req, res) => {
    const setNum = req.params.num;
    legoData.deleteSet(setNum)
        .then(() => res.redirect('/lego/sets'))
        .catch(err => res.status(500).render('500', { message: `Error: ${err.message}` }));
});

app.get("/login", (req, res) => {
    res.render("login", { 
        page: 'login', 
        errorMessage: '', 
        successMessage: '', 
        userName: '' 
    });
});

app.get('/register', (req, res) => {
    const status = req.query.status || '';
    const message = req.query.message || '';
    const userName = req.query.userName || '';

    res.render('register', {
        page: 'register',
        successMessage: status === 'success' ? message : null,
        errorMessage: status === 'error' ? message : null,
        showForm: status !== 'success',
        userName: userName || ' '
    });
});

app.post('/register', (req, res) => {
    const userData = req.body;
    authData.registerUser(userData)
        .then(() => res.redirect('/register?status=success&message=User%20created%20successfully!'))
        .catch(err => res.redirect(`/register?status=error&message=${encodeURIComponent(err.message)}&userName=${encodeURIComponent(userData.userName)}`));
});

app.post("/login", (req, res) => {
    req.body.userAgent = req.get('User-Agent');
    authData.checkUser(req.body)
        .then(user => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            };
            res.redirect("/lego/sets");
        })
        .catch(err => res.render("login", { 
            page: 'login', 
            errorMessage: err.message, 
            userName: req.body.userName || '',
            successMessage: '' 
        }));
});

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory", { 
        page: 'userHistory',
        user: req.session.user 
    });
});

app.use((req, res) => {
    res.status(404).render('404', { page: '404', message: 'Page not found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('500', { page: '500', message: 'Internal Server Error' });
});


legoData.initialize()
    .then(authData.initialize)
    .then(() => app.listen(port, () => console.log(`App listening on port ${port}`)))
    .catch(err => console.log(`Unable to start server: ${err}`));
