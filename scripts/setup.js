'use strict';

const db = require('@arangodb').db;

if (!db._collection('sessions')) {
    db._createDocumentCollection('sessions');
}
if (!db._collection('posts')) {
    db._createDocumentCollection('posts');
}
if (!db._collection('comments')) {
    db._createDocumentCollection('comments');
}

if (!db._collection('users')) {
    db._createDocumentCollection('users');
    db._collection('users').ensureIndex({
        type: 'hash',
        fields: ['username'],
        unique: true
    });
}

