let express = require('express');
let router = express.Router();
let userController = require('../controllers/userController');

router.get('/login', (req, res) => {
    req.session.returnURL = req.query.returnURL;
    res.render('login');
});

router.post('/login', (req, res, next) => {
    let email = req.body.username;
    let password = req.body.password;
    let keepLoggedIn = (req.body.keepLoggedIn != undefined);
    userController
        .getUserByEmail(email)
        .then(user => {
            if (user) {
                if(userController.comparePassword(password, user.password)) {
                    req.session.cookie.maxAge = keepLoggedIn ? 30 * 24 * 60 * 60 * 100 : null;
                    req.session.user = user;
                    if (req.session.returnURL) {
                        res.redirect(req.session.returnURL);
                    } else {
                        res.redirect('/');
                    }      
                } else {
                    res.render('login', {
                        message: 'Incorrect Password',
                        type: 'alert-danger'
                    })
                }
            } else {
                res.render('login', {
                    message: 'Email does not exists!',
                    type: 'alert-danger '
                })
            }
        });
});

router.get('/register', (req, res) => {
    res.render('register');
});

router.post('/register', (req, res, next) => {
    let fullname = req.body.fullname;
    let email = req.body.username;
    let password = req.body.password;
    let confirmPassword = req.body.confirmPassword;
    let keepLoggedIn = (req.body.keepLoggedIn != undefined);

    // Kiem tra confirmPassword va Password giong nhau
    if(password != confirmPassword) {
        return res.render('register', {
            message: 'Confirm password does not match!',
            type: 'alert-danger'
        });
    }
    // Kiem tra username chua ton tai
    userController
        .getUserByEmail(email)
        .then(user => {
            if (user) {
                return res.render('register', {
                    message: `Email ${email} exists! Please choose another email address`,
                    type: 'alert-danger'
                });
            }
            // Tao tai khoan
            user = {
                fullname,
                username: email,
                password 
            };
            return userController
                .createUser(user)
                .then(user => {
                    if (keepLoggedIn) {
                        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 100;
                        req.session.user = user;
                        res.redirect('/');
                    } else {
                        res.render('login', {
                            message: 'You have registered, now please login',
                            type: 'alert-primary'
                        });
                    } 
                });
        })
        .catch(error => next(error));
});

router.get('/logout', (req, res, next) => {
    req.session.destroy(error => {
        if (error) {
            return next(error);
        }
        return res.redirect('/users/login');
    });
});

module.exports = router;