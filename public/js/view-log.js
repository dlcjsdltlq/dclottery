const ERROR_LIST = { 
    URL_ERROR: {
        msg: 'URL을 인식할 수 없습니다. 확인해 주세요.'
    }, 
    DB_ERROR: {
        msg: '서버 DB에 오류가 발생하였습니다. 확인해 주세요.'
    },
    GET_COMMENT_ERROR: {
        msg: '댓글을 가져오는데 실패했습니다. 잠시후 다시 시도해 주세요.'
    }, 
    NUM_OF_USERS_IS_NOT_CORRECT: {
        msg: '총 참가 인원수가 일치하지 않습니다. 확인해 주세요.'
    },
    ALREADY_DRAWN: {
        msg: '이미 추첨하였습니다.'
    },
    ENTRY_NUM_IS_BIGGER_THAN_ALL: {
        msg: '추첨 인원이 총 인원보다 클 수 없습니다.'
    },
    ERROR_ELSE: {
        msg: '서버에 알 수 없는 오류가 발생하였습니다. 관리자에게 문의해 주세요.'
    },
    ERROR_CLIENT: {
        msg: '오류가 발생하였습니다.'
    },
    EMPTY_ARRAY: {
        msg: '로그가 없습니다.'
    }
};

const getArticle = async (start, end) => {
    const logTableElement = document.querySelector('#log-table');
    try {
        const res = await axios({
            method: 'post', 
            url: '/api/getloglist',
            data: {
                start: start,
                end: end
            }
        });
        if (!res.data.status) throw res.data.result;
        const logDatas = res.data.result.drawData;
        if (!res.data.result) throw 'EMPTY_ARRAY';
        for (const logData of logDatas.reverse()) {
            let newRow = logTableElement.insertRow();
            newRow.insertCell().appendChild(document.createTextNode(logData.logNo));
            let textNode = '';
            for (const userInfo of logData.winners) textNode += `${userInfo[0]}(${userInfo[1]}), `;
            textNode = textNode.substr(0, textNode.length - 2);
            if (textNode.length > 35) textNode = textNode.substr(0, 35) + '...';
            let a = document.createElement('a');
            a.setAttribute('href', `/view_log/${logData.logNo}`);
            a.appendChild(document.createTextNode(textNode));
            newRow.insertCell().appendChild(a);
            newRow.insertCell().appendChild(document.createTextNode(logData.gallId));
            newRow.insertCell().appendChild(document.createTextNode(logData.articleNo));
        }
    } catch (e) {
        if (!(e in ERROR_LIST)) e = 'ERROR_ELSE';
        alert(ERROR_LIST[e].msg);
    }
};

const checkPageAndGetLog = async (button) => {
    button.classList.add('loading');
    const currentPageElement = document.querySelector('#cur-page');
    const currentPage = currentPageElement.getAttribute('data-page');
    let nextPage = currentPageElement.getAttribute('data-page');
    if (nextPage === '0') {
        try {
            const res = await axios({
                method: 'get', 
                url: '/api/getlastlogno'
            });
            if (!res.data.status) throw res.data.result;
            nextPage = res.data.result;
        } catch (e) {
            if (!(e in ERROR_LIST)) e = 'ERROR_ELSE';
            alert(ERROR_LIST[e].msg);
        }
    }
    if (nextPage <= 1) { button.classList.remove('loading'); return; }
    let startPage = nextPage - 9;
    if (nextPage < 10 && currentPage !== '0') { nextPage -= 1; startPage = 1; }
    await getArticle(startPage, nextPage);
    currentPageElement.setAttribute('data-page', startPage);
    button.classList.remove('loading');
};