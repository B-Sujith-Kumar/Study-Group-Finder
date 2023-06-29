
const User = require('../models/user-model');

const authUtil = require('../util/authentication');

const userDetailsAreValid = require('../util/validation');

const sessionFlash = require('../util/session-flash');
const session = require('express-session');

function getHome(req, res) {
    res.render('users/index');
}

function getSignup(req, res) {
    let sessionData = sessionFlash.getSessionData(req);
    
    if(!sessionData) {
        sessionData = {
            email: '',
            password: '',
            name: '',
            phnumber: ''
        }
    }

    res.render('users/auth/signup', {inputData: sessionData} );
}

async function signup(req, res, next) {
    const enteredData = {
        email: req.body.email, password: req.body.password, name: req.body.name, phnumber: req.body.phnumber
    };

    if(!userDetailsAreValid( req.body.email, req.body.password, req.body.name, req.body.phnumber )) {
        sessionFlash.flashDataToSession(req, {
            errorMessage: "Please check your input!", ...enteredData
        }, function() {
            res.redirect('/signup');
        })
        return;
    }

    const user = new User(req.body.email, req.body.password, req.body.name, req.body.phnumber);

    const existsAlready = await user.existsAlready();
       
    try {
        if(existsAlready) {
            sessionFlash.flashDataToSession(req, {
                errorMessage: "User exists already! Log in instead!",
                ...enteredData
            }, function() {
                res.redirect('/signup');
            })
            return;
        }
        await user.signup();
    } catch (error) {
        next(error);
        return;
    }

    res.redirect('/login');
}

function getLogin(req, res) {
    let sessionData = sessionFlash.getSessionData(req);

    if(!sessionData) {
        sessionData = {
            email: '',
            password: ''
        }
    }

    res.render('users/auth/login', { inputData: sessionData });
}

async function login(req, res, next) {
    const user = new User(req.body.email, req.body.password);
    let existingUser;
    try {
        existingUser = await user.getUserWithSameEmail();
    } catch (error) {
        next(error);
        return;
    }

    const sessionErrorData = {
        errorMessage: 'Please check your email and password',
        email: user.email,
        password: user.password
    }

    if(!existingUser) {
        sessionFlash.flashDataToSession(req, sessionErrorData, function() {
            res.redirect('/login');
        })
        return;
    }

    const passwordIsCorrect = await user.hasMatchingPassword(existingUser.password);

    if(!passwordIsCorrect) {
        sessionFlash.flashDataToSession(req, sessionErrorData, function() {
            res.redirect('/login');
        });
        return;
    }

    authUtil.createUserSession(req, existingUser, function() {
        res.redirect('/');
    })
}

function logout(req, res) {
    authUtil.destroyUserAuthSession(req);
    res.redirect('/login');
}

module.exports = {
    getSignup: getSignup,
    getLogin: getLogin,
    getHome: getHome,
    signup: signup,
    login: login,
    logout: logout
}