/********************************************************************************

* WEB322 – Assignment 03

*

* I declare that this assignment is my own work in accordance with Seneca's

* Academic Integrity Policy:

*

* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html

*

* Name: Zainab Mustak Vadia Student ID: 119574234 Date: 06/18/2024

*

* Published URL:

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

    app.get('/', (req, res) => {
        res.render('home', { page: 'home' });
    });

    app.get('/about',(req,res) => {
        res.render(path.join(__dirname,'/views/about.ejs'))
    });
    
    app.get('/lego/sets', (req, res) => {
        if (req.query.theme) {

            legoData.getSetsByTheme(req.query.theme)
            .then(sets => {
                res.render('sets', {sets: sets});
            })
            .catch(error => {
                res.render('404', { page: '404', message: 'Set not found' });
            });
        } else {
        legoData.getAllSets()
            .then(sets => {
                res.render('sets', {sets: sets});
            })
            .catch(error => {
                res.render('404', { page: '404', message: 'Set not found' });
            });
        }

    });

    app.get('/lego/sets/:id', (req, res) => {
        legoData.getSetByNum(req.params.id).then(setData => {
            res.render('set', {set: setData});
        }).catch(error => {
            res.render('404', { page: '404', message: 'Set not found' });
            });   
    });
    
    app.get('*', (req, res) => {
        res.status(404).render('404', { page: '404' });
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