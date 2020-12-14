const express = require('express');

const draw = require('../controllers');

const router = express.Router();

router.get('/', (req, res) => {
    res.render('index');
});
router.get('/view_log', (req, res) => {
    res.render('view-log');
});
router.get('/view_log/:logNo', draw.getLog);
router.get('/robots.txt', (req, res) => res.send('<pre>User-Agent: *\nDisallow: /\nAllow: /$<pre>'));

router.get('/api/getlastlogno', draw.getLastLogNo);

router.post('/api/getcomment', draw.getCommentList);
router.post('/api/draw', draw.drawUsers);
router.post('/api/getrecent', draw.getRecentWinners);
router.post('/api/getloglist', draw.getLogList);

module.exports = router;