/**
 * Package entry: re-export app factory for consumers who embed the API.
 */
const { createApp } = require('./app');
const productStore = require('./productStore');

module.exports = { createApp, productStore };
