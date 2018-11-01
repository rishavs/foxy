'use strict';

const dd = require('dedent');
const joi = require('joi');
const createAuth = require('@arangodb/foxx/auth');
const createRouter = require('@arangodb/foxx/router');
const db = require('@arangodb').db;
const errors = require('@arangodb').errors;

const router = createRouter();
const posts = db._collection('posts');
const users = db._collection('users');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;

// --------------------------------
// Create a new post
// --------------------------------
router.post('/createPost', (req, res) => {
    const post = {};
    try {
        const user = users.document(req.session.uid);
        post.title = req.body.title.trim();
        post.link = req.body.link.trim();
        post.content = req.body.content.trim();
        post.author = user.username;

        post.is_deleted = false
        post.created_at = Date.now()
        post.updated_at = Date.now()
        post.deleted_at = ''

        const meta = posts.save(post);
        Object.assign(post, meta);

    } catch (e) {
        if (e.isArangoError && e.errorNum === 1205) {
            res.throw(401, 'Not Authenticated', e);
        } else {
            res.throw(e.errorNum, e);
        }
        
    }
    res.send({
        success: true,
        data: post
    });
})
    .body(joi.object({
        title: joi.string().required(),
        link: joi.string().allow('').optional(),
        content: joi.string().allow('').optional(),
    }).required())
    .summary('Create a new post')
    .description('Creates a new post and returns its details');

// --------------------------------
// Get a post by its key
// --------------------------------

router.get('/getPost/:key', function (req, res) {
    let post = {}
    try {
        post = posts.document(req.pathParams.key)
    } catch (e) {
        res.throw(e.errorNum, e);
    }
    res.send({
        success: true,
        data: post
    });
})
    .pathParam('key', joi.string().required(), 'Key of the post')
    .summary('Get details of a specific post')
    .description('Gets a post by its key');

// --------------------------------
// Get list of all posts
// --------------------------------

router.get('/getAllPosts', function (req, res) {
    let postslist
    try {
        postslist = posts.all().toArray()
    } catch (e) {
        res.throw(e.errorNum, e);
    }
    res.send({
        success: true,
        data: postslist
    });
})
    .summary('List all posts')
    .description('Retrieves a list of all posts');

    
module.exports = router;