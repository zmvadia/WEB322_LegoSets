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
const legoData = require('./modules/legoSets');
const path = require('path');
const bodyParser = require('body-parser');
const authData = require('./modules/auth-service');

const app = express();
const port = 8080;


app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

require('pg'); 
const Sequelize = require('sequelize');
const clientSessions = require('client-sessions');

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
    clientSessions({
       cookieName: 'session', // this is the object name that will be added to 'req'
       secret: 'o6LjQ5EVNC28ZgK64hDELM18ScpFQr', // this should be a long un-guessable string.
       duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
       activeDuration: 1000 * 60, // the session will be extended by this many ms each request (1 minute)
       })
   );
   app.use(express.static(__dirname + '/public'));


function ensureLogin(req, res, next) {
    if (!req.session.user) {
      res.redirect('/login');
    } else {
      next();
    }
  };
   app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
    });

app.get('/', (req, res, next) => {
    try {
        res.render('home', { page: 'home' });
    } catch (error) {
        next(error);
    }
});

app.get('/about', (req, res) => {
    res.render(path.join(__dirname, '/views/about.ejs'));
});

app.get('/lego/sets', (req, res) => {
    if (req.query.theme) {
        legoData.getSetsByTheme(req.query.theme)
            .then(sets => {
                res.render('sets', { sets: sets });
            })
            .catch(error => {
                res.render('404', { page: '404', message: 'Set not found' });
            });
    } else {
        legoData.getAllSets()
            .then(sets => {
                res.render('sets', { sets: sets });
            })
            .catch(error => {
                res.render('404', { page: '404', message: 'Set not found' });
            });
    }
});

app.get('/lego/addSet', (req, res) => {
    legoData.getAllThemes()
       .then((themeData) => {
            res.render('addSet', { themes: themeData });
        })
       .catch((err) => {
            console.error(err);
            res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
        });
});

app.post('/lego/addSet', ensureLogin, (req, res) => {
    legoData.addSet(req.body)
       .then(() => {
            res.redirect('/lego/sets');
        })
       .catch((err) => {
            console.error(err);
            res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
        });
});

app.get('/lego/editSet/:num', (req, res) => {
    const setNum = req.params.num;
    Promise.all([legoData.getSetByNum(setNum), legoData.getAllThemes()])
        .then(([setData, themeData]) => {
            res.render('editSet', { themes: themeData, set: setData });
        })
        .catch((err) => {
            console.error(err);
            res.status(404).render('404', { message: `Unable to retrieve data: ${err.message}` });
        });
});

app.post('/lego/editSet', ensureLogin, (req, res) => {
    const { set_num } = req.body;
    legoData.editSet(set_num, req.body)
        .then(() => {
            res.redirect('/lego/sets');
        })
        .catch((err) => {
            console.error(err);
            res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err.message}` });
        });
});

app.get('/lego/sets/:id', (req, res) => {
    legoData.getSetByNum(req.params.id)
        .then(setData => {
            res.render('set', { set: setData });
        })
        .catch(error => {
            res.render('404', { page: '404', message: 'Set not found' });
        });
});

app.get('/lego/deleteSet/:num', ensureLogin, (req, res) => {
    const setNum = req.params.num;
    
    legoData.deleteSet(setNum)
        .then(() => {
            res.redirect('/lego/sets');
        })
        .catch(err => {
            console.error(err);
            res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
        });
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
        .then(() => {
            res.redirect('/register?status=success&message=User%20created%20successfully!'); 
        })
        .catch((err) => {
            res.redirect(`/register?status=error&message=${encodeURIComponent(err.message)}&userName=${encodeURIComponent(userData.userName)}`); 
        });
});

app.post("/login", (req, res) => {
    req.body.userAgent = req.get('User-Agent');

    authData.checkUser(req.body)
        .then((user) => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            };
            res.redirect("/lego/sets");
        })
        .catch((err) => {

            res.render("login", { 
                page: 'login', 
                errorMessage: err, 
                userName: req.body.userName || '',
                successMessage: '' 
            });
        });
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
    res.status(500).render('500', { page: '404', message: 'Internal Server Error' });
});

app.get('*', (req, res) => {
    console.log('Catch-all route hit');
    res.status(404).send('Not found');
  });

legoData.initialize()
    .then(authData.initialize)
    .then(function () {
        app.listen(port, function () {
            console.log(`app listening on: ${port}`);
        });
    })
    .catch(function (err) {
        console.log(`unable to start server: ${err}`);
    });