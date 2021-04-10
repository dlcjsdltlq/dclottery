const randInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
};

const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

const removeOverlap = (arr) => {
    let uniques = [];
    let itemsFound = {};
    for(let i = 0, l = arr.length; i < l; i++) {
        let stringified = JSON.stringify(arr[i]);
        if(itemsFound[stringified]) continue;
        uniques.push(arr[i]);
        itemsFound[stringified] = true;
    }
    return uniques;
};

const isArrayEqual  = (a, b) => {
    return JSON.stringify(a) === JSON.stringify(b);
};

const sleep = (t) => {
    return new Promise(resolve=>setTimeout(resolve,t));
};

const capture = async (page, logNo) => {
    page.setViewport({ width: 1560, height: 10, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:3000/result_page/${logNo}`);
    const data = await page.screenshot({
        fullPage: true,
        encoding: 'base64'
    });
    return data;
};


module.exports = {
    randInt,
    shuffle,
    removeOverlap,
    isArrayEqual,
    sleep,
    capture
};