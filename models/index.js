const autoIncrement = require('mongoose-auto-increment');
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/dcdraw", { useFindAndModify: false });
const db = mongoose.connection;
autoIncrement.initialize(db);
db.on('error', console.error.bind(console, 'Connection Error:'));
db.once('open', () => {
    console.log("MongoDB Connected");
});

const drawSchema = new mongoose.Schema({
    gallId: String,
    articleNo: String,
    entries: Array,
    comments: String,
    createDate: {
        type: Date,
        expires: 600,
        default: Date.now
    }
});

const recentWinnerSchema = new mongoose.Schema({
    findId: Number,
    recentWinners: Array
});

const logSchema = new mongoose.Schema({
    logNo: Number,
    gallId: String,
    articleNo: String,
    entries: Array,
    includeEntries: Array,
    excludeEntries: Array,
    numOfEntries: Number,
    winners: Array,
    createDate: {
        type: Date,
        expires: 15780000,
        default: Date.now
    }
});

logSchema.plugin(autoIncrement.plugin, {
    model: 'LogModel',
    field: 'logNo',
    startAt: 1,
    increment: 1
});

const DrawModel = mongoose.model('DrawModel', drawSchema);
const RecentWinnersModel = mongoose.model('RecentWinnersModel', recentWinnerSchema);
const LogModel = mongoose.model('LogModel', logSchema);

const addDrawData = async (gallId, articleNo, entries, comments) => {
    const drawInstance = new DrawModel({
        gallId: gallId,
        articleNo: articleNo,
        entries: entries,
        comments: JSON.stringify(comments)
    });
    try {
        const res = await drawInstance.save();
        return { status: true, result: res.id };
    } catch (error) {
        return { status: false, result: 'error' };
    }
};

const getDrawData = async (uniqueId) => {
    try {
        const res = await DrawModel.findOneAndDelete({ _id: uniqueId });
        const comments = JSON.parse(res.comments);
        res.comments = comments;
        return { status: true, result: res };
    } catch (error) {
        return { status: false, result: 'error' };
    }
};

const initializeRecentWinnerDB = async () => {
    try {
        const res = await RecentWinnersModel.findOne({ findId: 1 }); 
        if (!res) throw 'ERROR';   
    } catch (e) {
        const recentWinnerInstance = new RecentWinnersModel({
            findId: 1,
            recentWinners: []
        });
        const res = await recentWinnerInstance.save();
    }
};
 
const updateRecentWinner = async (recentWinners) => {
    try {
        const res = await RecentWinnersModel.findOne({ findId: 1 });
        const tempArr = JSON.parse(JSON.stringify(recentWinners));
        const resArr = res.recentWinners;
        while (tempArr.length !== 0) {
            resArr.push(tempArr.shift());
            if (resArr.length > 20) resArr.shift();
        }
        await RecentWinnersModel.updateOne({ findId: 1 }, { $set: { recentWinners: resArr } });
        return { status: true };
    } catch (e) {
        return { status: false };
    }
};

const getRecentWinner = async () => {
    try {
        const res = await RecentWinnersModel.findOne({ findId: 1 });
        return { status: true, result: res.recentWinners };
    } catch (e) {
        return { status: false, result: 'DB_ERROR' };
    }
};

const addLog = async (gallId, articleNo, entries, includeEntries, excludeEntries, numOfEntries, winners) => {
    try {
        const logInstance = new LogModel({
            gallId: gallId,
            articleNo: articleNo,
            entries: entries,
            includeEntries: includeEntries,
            excludeEntries: excludeEntries,
            numOfEntries: numOfEntries,
            winners: winners
        });
        const res = await logInstance.save();
        return { status: true, result: { logNo: res.logNo } };
    } catch (e) {
        return { status: false };
    }
}

const getLogList = async (start, end) => {
    try {
        if (start >= end) throw 'START_IS_BIGGER_THAN_END';
        if (end - start > 10) end = start + 10;
        const res = await LogModel.find({ logNo: { $gte: start, $lte: end } }).select('logNo winners gallId articleNo -_id');
        const lastLogNo = (await LogModel.find({}).sort({ _id: -1 }).limit(1))[0].logNo;
        return { status: true, result: { drawData: res, lastLogNo: lastLogNo } };
    } catch (e) {
        return { status: false, result: e };
    }
};

const getLog = async (logNo) => {
    try {
        const res = await LogModel.findOne({ logNo: logNo }).lean();
        const date = new Date(res.createDate);
        res.createDate = date.toLocaleString();
        return { status: true, result: res };
    } catch (e) {
        console.log(e)
        return { status: false, result: e };
    }
};

const getLastLogNo = async () => {
    try {
        const res = (await LogModel.find({}).sort({ _id: -1 }).limit(1))[0].logNo;
        return { status: true, result: res };
    } catch (e) {
        return { status: false, result: e };
    }
};

module.exports = {
    addDrawData,
    getDrawData,
    initializeRecentWinnerDB,
    updateRecentWinner,
    getRecentWinner,
    addLog,
    getLog,
    getLogList,
    getLastLogNo
};