const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ ok: 'usa' });
});

router.get('/meta', (req, res) => {
  res.json({
    title: 'My Title',
    description: 'My description',
    something: 'else',
  });
});

module.exports = router;
