// This makes it possible test crypto functions inside of jsdom.
const { Crypto } = require('@peculiar/webcrypto');
global.crypto = new Crypto();

// const crypto = require('crypto');
// global.crypto = crypto.webcrypto;
