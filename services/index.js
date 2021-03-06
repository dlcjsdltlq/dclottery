const request = require("request");
const cheerio = require("cheerio");
const utils = require("../utils");

const getComment = async (gallId, articleNo, isMini) => {
    const articleURL = `https://gall.dcinside.com/board/view/?id=${gallId}&no=${articleNo}&_rk=&page=1`;
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36";
    const getTokenOptions = {
        uri: articleURL,
        method: "GET",
        headers: {
            'User-Agent': userAgent
        }
    }
    let body = await new Promise((resolve, reject) => request.get(getTokenOptions, (error, response, body) => {resolve(body)}));
    let $ = cheerio.load(body);
    let e_s_n_o = $("#e_s_n_o").attr("value");
    if (!e_s_n_o) {
        getTokenOptions.uri = `https://gall.dcinside.com/${isMini ? 'mini' : 'mgallery'}/board/view/?id=${gallId}&no=${articleNo}&_rk=&page=1`
        body = await new Promise((resolve, reject) => request.get(getTokenOptions, (error, response, body) => {resolve(body)}));
        $ = cheerio.load(body);
        e_s_n_o = $("#e_s_n_o").attr("value");
    }
    const getCommentOptions = {
        uri: "https://gall.dcinside.com/board/comment/",
        method: "POST",
        headers: {
            'User-Agent': userAgent,
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest'
        },
        form: {
            id: gallId,
            no: articleNo,
            cmt_id: gallId,
            cmt_no: articleNo,
            e_s_n_o: e_s_n_o,
            comment_page: 1,
            _GALLTYPE_: isMini && 'MI'
        },
        json: true
    };
    const entries = [], comments = {}, dates = {};
    let totalPages = -1;
    while (totalPages) {
        const commentBody = await new Promise((resolve, reject) => request.post(getCommentOptions, (error, response, body) => {resolve(body)}));
        if (totalPages === -1) totalPages = Math.ceil(commentBody.total_cnt / 106);
        getCommentOptions.form.comment_page = totalPages--;
        for (const entryInfo of commentBody.comments) {
            const ip = entryInfo.ip;
            const name = entryInfo.name;
            const comment = entryInfo.memo;
            const ipOrId = ip ? ip : entryInfo.user_id;
            const date = utils.nomalizeDate(entryInfo.reg_date);
            if (name === "댓글돌이") continue;
            entries.push([name, ipOrId]);
            comments[name + ipOrId] = comment;
            if (!(name + ipOrId in dates)) dates[name + ipOrId] = date;
        }
    }
    return { entries: utils.removeOverlap(entries), comments: comments, dates: dates };
};

const parseURL = (url) => {
    const idPattern = /id=(\w+)/g;
    const noPattern = /&no=(\d+)/g;
    const mIdPattern = /\/board\/(\w+)/g;
    const mNoPattern = /\/(\d+)/g;
    let id, no;
    try {
        id = url.match(idPattern)[0].replace('id=', '');
        no = url.match(noPattern)[0].replace('&no=', '');
    } catch {
        id = url.match(mIdPattern)[0].replace('/board/', '');
        no = url.match(mNoPattern)[0].replace('/', '');
    }
    return { id: id, no: no, isMini: url.includes('mini') };
};

module.exports = {
    getComment,
    parseURL
};