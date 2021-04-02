const express = require('express');

const draw = require('../controllers');

const router = express.Router();

router.get('/', (req, res) => {
    res.render('index');
});
router.get('/result_page/:logNo', draw.renderResultPage);
router.get('/view_log', (req, res) => {
    res.render('view-log');
});
router.get('/view_log/:logNo', draw.renderLogPage);
router.get('/robots.txt', (req, res) => res.send('<pre>User-agent: *\nDisallow: /\nAllow: /$<pre>'));

router.get('/api/getlastlogno', draw.getLastLogNo);

router.get('/api/getscreenshot/:logNo', draw.getScreenShot)

router.post('/api/getcomment', draw.getCommentList);
router.post('/api/draw', draw.drawUsers);
router.post('/api/getrecent', draw.getRecentWinners);
router.post('/api/getloglist', draw.getLogList);

module.exports = router;