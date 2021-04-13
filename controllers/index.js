const commentService = require("../services");
const drawModel = require("../models");
const utils = require("../utils");

const ERROR_LIST = ['URL_ERROR', 'DB_ERROR', 'GET_COMMENT_ERROR', 'NUM_OF_USERS_IS_NOT_CORRECT', 'ERROR_ELSE'];

const getCommentList = async (req, res) => {
    const url = req.body.url;
    try {
        const parsedURL = commentService.parseURL(url);
        if (!parsedURL) throw 'URL_ERROR';
        const id = parsedURL.id;
        const no = parsedURL.no;
        const entryDatas = await commentService.getComment(id, no);
        const dbRes = await drawModel.addDrawData(id, no, entryDatas.entries, entryDatas.comments);
        if (!dbRes.status) throw 'DB_ERROR';
        res.json({ status: true, result: entryDatas, callId: dbRes.result });
    } catch (e) {
        let resError = ERROR_LIST.includes(e) ? e : 'GET_COMMENT_ERROR';
        res.json({ status: false, result: resError });
    }
};

const drawUsers = async (req, res) => {
    try {
        const numOfEntries = req.body.numOfEntries;
        const includeEntries = req.body.includeEntries;
        const excludeEntries = req.body.excludeEntries;
        const callId = req.body.callId;
        const dbRes = await drawModel.getDrawData(callId);
        if (!dbRes.status) throw 'DB_ERROR';
        const checkEntries = includeEntries.concat(excludeEntries);
        if (!utils.isArrayEqual(dbRes.result.entries.sort(), checkEntries.sort())) throw 'NUM_OF_USERS_IS_NOT_CORRECT';
        const winners = [];
        const shuffledEntries = utils.shuffle(includeEntries);
        for (let i = 0; i < numOfEntries; i++) {
            winners.push(shuffledEntries[i]);
        }
        const recentDbRes = await drawModel.updateRecentWinner(winners);
        if (!recentDbRes.status) throw 'DB_ERROR';
        const logDbRes = await drawModel.addLog(dbRes.result.gallId, dbRes.result.articleNo, checkEntries, includeEntries, excludeEntries, numOfEntries, winners);
        if (!logDbRes.status) throw 'DB_ERROR';
        res.json({ status: true, result: { winners: winners, logNo: logDbRes.result.logNo } });
    } catch (e) {
        let resError = ERROR_LIST.includes(e) ? e : 'ERROR_ELSE'; 
        res.json({ status: false, result: resError });
    }
};

const getRecentWinners = async (req, res) => {
    try {
        const dbRes = await drawModel.getRecentWinner();
        if (!dbRes.status) throw 'DB_ERROR';
        res.json({ status: true, result: dbRes.result })
    } catch (e) {
        let resError = ERROR_LIST.includes(e) ? e : 'ERROR_ELSE'; 
        res.json({ status: false, result: resError });
    }
}; 

const getLogList = async (req, res) => {
    try {
        const start = req.body.start;
        const end = req.body.end;
        const dbRes = await drawModel.getLogList(start, end);
        if (!dbRes.status) throw 'DB_ERROR';
        res.json({ status: true, result: dbRes.result });
    } catch (e) {
        let resError = ERROR_LIST.includes(e) ? e : 'ERROR_ELSE'; 
        res.json({ status: false, result: resError })
    }
};


const renderResultPage = async (req, res) => {
    try {
        const logNo = req.params.logNo;
        const dbRes = await drawModel.getLog(logNo);
        if (!dbRes.status) throw 'DB_ERROR';
        res.render('result-page', { status: true, result: dbRes.result });
    } catch (e) {
        let resError = ERROR_LIST.includes(e) ? e : 'ERROR_ELSE'; 
        res.render('result-page', { status: true, result: resError });
    }
};


const renderLogPage = async (req, res) => {
    try {
        const logNo = req.params.logNo;
        const dbRes = await drawModel.getLog(logNo);
        if (!dbRes.status) throw 'DB_ERROR';
        res.render('view-detailed-log', { status: true, result: dbRes.result });
    } catch (e) {
        let resError = ERROR_LIST.includes(e) ? e : 'ERROR_ELSE'; 
        res.render('view-detailed-log', { status: false, result: resError });
    }
};

const getLastLogNo = async (req, res) => {
    try {
        const dbRes = await drawModel.getLastLogNo();
        if (!dbRes.status) throw 'DB_ERROR';
        res.json({ status: true, result: dbRes.result });
    } catch (e) {
        let resError = ERROR_LIST.includes(e) ? e : 'ERROR_ELSE'; 
        res.json({ status: false, result: resError })
    }
};

const getScreenShot = async (req, res) => {
    try {
        const logNo = req.params.logNo;
        const data = await utils.capture(req.app.locals.page, logNo);
        const buffer = new Buffer.from(data, 'base64');
        res.writeHead(200, {
            'Content-Disposition': `attachment;filename=dclottery.live-${(new Date).toISOString()}-${logNo}.png`,
            'Content-Length': Buffer.byteLength(buffer),
            'Content-Type': 'image/png'
        });
        res.end(buffer);
    } catch (e) {
        console.log(e)
        let resError = ERROR_LIST.includes(e) ? e : 'ERROR_ELSE'; 
        res.json({ status: true, result: resError });
    }
}

module.exports = {
    getCommentList,
    drawUsers,
    getRecentWinners,
    getLogList,
    renderLogPage,
    renderResultPage,
    getLastLogNo,
    getScreenShot
};