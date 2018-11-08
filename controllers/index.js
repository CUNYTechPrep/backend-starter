const express = require('express');
const router = express.Router();


router.use('/', require('./home'));


module.exports = router;
