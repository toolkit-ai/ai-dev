'use strict';

const hostCore = require('..');
const assert = require('assert').strict;

assert.strictEqual(hostCore(), 'Hello from hostCore');
console.info('hostCore tests passed');
