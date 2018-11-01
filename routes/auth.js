'use strict';

const dd = require('dedent');
const joi = require('joi');
const createAuth = require('@arangodb/foxx/auth');
const createRouter = require('@arangodb/foxx/router');
const db = require('@arangodb').db;
const errors = require('@arangodb').errors;

const auth = createAuth();
const router = createRouter();
const users = db._collection('users');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;

// --------------------------------
// Auth Route - Signup
// --------------------------------
router.post('/signup', (req, res) => {
    const user = {};
    try {
        user.authData = auth.create(req.body.password);
        user.username = req.body.username.toLowerCase().trim();
        user.role = 'regular';
        user.nickname = req.body.nick ? req.body.nick.trim() : 'Nony Mouse'
        user.flair = req.body.flair ? req.body.flair.trim() : 'is a shy lil mouse!'
        const meta = users.save(user);
        Object.assign(user, meta);
    } catch (e) {
        if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
            res.throw(409, 'The Username is already taken', e);
        } else {
            res.throw(500, 'Unidentified server error. Please contact the admin', e);
        }
    }
    req.session.uid = user._key;
    req.sessionStorage.save(req.session);
    res.send({ 
        success: true ,
        data: {
            username: user.username,
            nickname: user.nickname,
            flair: user.flair
        }
    });
})
    .body(joi.object({
        username: joi.string().required(),
        password: joi.string().required(),
        nickname: joi.string().allow('').optional(),
        flair: joi.string().allow('').optional()
    }).required(), 'Credentials')
    .summary('Creates a new user')
    .description('Creates a new user and logs them in.');

// --------------------------------
// Auth Route - testing user id
// --------------------------------
router.get('/whoami', function (req, res) {
    try {
        const user = users.document(req.session.uid);
        res.send({ 
            success: true ,
            isLoggedIn: true,
            data: {
                username: user.username,
                nickname: user.nickname,
                flair: user.flair
            }
        });
    } catch (e) {
        res.send({ 
            success: true ,
            isLoggedIn: false,
            data: {
                username: '',
                nickname: '',
                flair: ''
            }
        });
    }
})
.summary('Get details of current user')
.description('Returns the currently active username.');

// --------------------------------
// Auth Route - continue session
// --------------------------------
router.get('/amiloggedin', function (req, res) {
    try {
        const user = users.document(req.session.uid);
        res.send({ 
            success: true ,
            isLoggedIn: true,
            data: {
                username: user.username,
                nickname: user.nickname,
                flair   : user.flair
            }
        });
    } catch (e) {
        req.session.uid = null;
        req.sessionStorage.save(req.session);
        res.send({ 
            success: true ,
            isLoggedIn: false,
            data: {
                username: '',
                nickname: '',
                flair   : ''
            }
        });
    }
})
.summary('Checks if user is logged in')
.description('Returns the currently active username.');

// --------------------------------
// Auth Route - Login
// --------------------------------
router.post('/login', function (req, res) {
    // This may return a user object or null
    const user = users.firstExample({
        username: req.body.username
    });
    const valid = auth.verify(
        // Pretend to validate even if no user was found
        user ? user.authData : {},
        req.body.password
    );
    if (!valid) res.throw('unauthorized');
    // Log the user in
    req.session.uid = user._key;
    req.sessionStorage.save(req.session);
    res.send({ 
        success: true ,
        isLoggedIn: true,
        data: {
            username: user.username,
            nickname: user.nickname,
            flair: user.flair
        }
    });
})
.body(joi.object({
    username: joi.string().required(),
    password: joi.string().required()
}).required(), 'Credentials')
.summary('Creates a user session')
.description('Logs a registered user in.');

// --------------------------------
// Auth Route - Logout
// --------------------------------
router.post('/logout', function (req, res) {
    if (req.session.uid) {
        req.session.uid = null;
        req.sessionStorage.save(req.session);
    }
    res.send({ success: true });
})
.summary('Removes a user session')
.description('Logs the current user out.');

module.exports = router;
