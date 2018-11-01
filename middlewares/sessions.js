const sessionsMiddleware = require('@arangodb/foxx/sessions');

const sessions = sessionsMiddleware({
    storage: 'sessions',
    transport: 'cookie'
});

// module.context.use(sessions);

module.exports = sessions