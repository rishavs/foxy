'use strict';

const sessionWare   = require('./middlewares/sessions')

const authRouter    = require('./routes/auth')
const postRouter    = require('./routes/posts')

// mount sessions
module.context.use('/', sessionWare);

// mount Routes
module.context.use('/', authRouter);
module.context.use('/', postRouter);