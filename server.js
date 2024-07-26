/********************************************************************************

* WEB322 – Assignment 04

*

* I declare that this assignment is my own work in accordance with Seneca's

* Academic Integrity Policy:

*

* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html

*

* Name: Zainab Mustak Vadia Student ID: 119574234 Date: 07/07/2024

*

* Published URL: https://vercel.com/zainab-mustak-vadias-projects/playground-ai-web322

*

********************************************************************************/
const express = require('express');
const legoData = require('./modules/legoSets');
const path = require('path');

const app = express();
const port = 8080;

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.urlencoded({ extended: true }));

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

app.post('/lego/addSet', (req, res) => {
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

app.post('/lego/editSet', (req, res) => {
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

app.get('/lego/deleteSet/:num', (req, res) => {
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

app.use((req, res) => {
    res.status(404).render('404', { page: '404', message: 'Page not found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('404', { page: '404', message: 'Internal Server Error' });
});

app.get('*', (req, res) => {
    console.log('Catch-all route hit');
    res.status(404).send('Not found');
  });

legoData.initialize()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    })
    .catch(error => {
        console.error('Initialization error:', error.message);
    });
