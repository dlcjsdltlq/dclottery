document.onkeydown = (e) => {
    e = e || window.event;
    switch (e.which || e.keyCode) {
        case 13:
        searchArticle();
    }
};

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
    }
};

const resetAll = () => {
    const entryElements = document.querySelectorAll('div[data-type="show"]');
    for (const entryElement of entryElements) {
        entryElements[i].parentNode.removeChild(entryElement);
    }
    document.querySelector('#winner-segment').style.display = 'none';
    document.querySelector('#call-id').setAttribute('data-token', '');
};

const searchArticle = async (element) => {
    resetAll();
    element.classList.add('loading');
    const dcUrl = document.querySelector('#url-input');
    try {
        const res = await axios({
            method: 'post',
            url: '/api/getcomment', 
            data: {
                url: dcUrl.value
            }
        });
        if (!res.data.status) throw res.data.result;
        const entries = res.data.result;
        const callId = res.data.callId;
        document.querySelector('#call-id').setAttribute('data-token', callId);
        const includeSegment = document.querySelector('#include-segment');
        for (const entryInfo of entries) {
            let tempNode = document.querySelector('div[data-type="template"]').cloneNode(true);
            tempNode.setAttribute("data-nick", entryInfo[0]);
            tempNode.setAttribute("data-id", entryInfo[1]);
            tempNode.querySelector('div.detail').textContent = entryInfo[1];
            tempNode.insertBefore(document.createTextNode(entryInfo[0]), tempNode.querySelector('div'));
            tempNode.style = 'margin: 1px;';
            tempNode.setAttribute('data-type', 'show');
            includeSegment.appendChild(tempNode);
        }
    } catch (e) {
        if (!(e in ERROR_LIST)) e = 'ERROR_CLIENT';
        alert(ERROR_LIST[e].msg);
    }
    element.classList.remove('loading');
    document.querySelector('.disabled').classList.remove('disabled');
};

const toggleExclude = (element) => {
    const targetElement = element.parentNode;
    targetElement.parentElement.removeChild(targetElement);
    if (targetElement.classList.contains('teal')) {
        targetElement.classList.remove('teal');
        targetElement.classList.add('red');
        document.querySelector('#exclude-segment').appendChild(targetElement);
    } else {
        targetElement.classList.remove('red');
        targetElement.classList.add('teal');
        document.querySelector('#include-segment').appendChild(targetElement);
    }
};

const clickDraw = async (element) => {
    element.classList.add('loading');
    const numOfEntriesElement = document.querySelector('#peoples');
    const numOfEntries = numOfEntriesElement.value;
    const includeEntriesElements = document.querySelectorAll('#include-segment > div[data-type="show"]');
    const excludeEntriesElements = document.querySelectorAll('#exclude-segment > div[data-type="show"]');
    if (numOfEntries <= 0 || includeEntriesElements.length < 1) {
        alert('최소 1명 이상의 사람 수가 필요합니다.');
        numOfEntriesElement.value = 1;
        element.classList.remove('loading');
        return;
    }
    const includeEntries = [], excludeEntries = [];
    for (const entryElement of includeEntriesElements) {
        includeEntries.push([entryElement.getAttribute('data-nick'), entryElement.getAttribute('data-id')]);
    }
    for (const entryElement of excludeEntriesElements) {
        excludeEntries.push([entryElement.getAttribute('data-nick'), entryElement.getAttribute('data-id')]);
    }
    try {
        const callId = document.querySelector('#call-id').getAttribute('data-token');
        if (!callId) throw 'ALREADY_DRAWN';
        if (includeEntries.length < numOfEntries) throw 'ENTRY_NUM_IS_BIGGER_THAN_ALL';
        const res = await axios({
            method: 'post',
            url: '/api/draw',
            data: {
                numOfEntries: numOfEntries,
                includeEntries: includeEntries,
                excludeEntries: excludeEntries,
                callId: callId
            }
        });
        if (!res.data.status) throw res.data.result;
        const winners = res.data.result;
        const winnerSegment = document.querySelector('#winner-segment');
        for (const winner of winners) {
            let winnerBox = document.querySelector(`div[data-id="${winner[1]}"]`).cloneNode(true);
            winnerBox.classList.remove('teal');
            winnerBox.classList.add('blue');
            winnerSegment.appendChild(winnerBox);
            document.querySelector('#call-id').setAttribute('data-token', '');
        }
        const allEntryElements = document.querySelectorAll('div[data-type="show"] > i');
        for (const entryElement of allEntryElements) entryElement.remove();
        showWinner();
    } catch (e) {
        if (!(e in ERROR_LIST)) e = 'ERROR_CLIENT';
        element.classList.remove('loading');
        alert(ERROR_LIST[e].msg);
        return;
    }
    element.classList.remove('loading');
    element.classList.add('disabled');
};

const showWinner = () => {
    document.querySelector('#winner-segment').style.display = 'block';
};

const viewRecentWinner = async () => {
    const recentWinnerSegment = document.querySelector('#recent-winner-segment');
    const recentWinnerElements = recentWinnerSegment.querySelectorAll('div[data-type="show_winner"]');
    if (recentWinnerElements) {
        for (const recentWinnerElement of recentWinnerElements) {
            recentWinnerSegment.removeChild(recentWinnerElement);
        }
    }
    const curState = recentWinnerSegment.style.display;
    recentWinnerSegment.style.display = curState === 'none' ? 'block' : 'none';
    if (curState === 'none') {
        try {
            const res = await axios({
                method: 'post',
                url: '/api/getrecent'
            });
            if (!res.data.status) throw res.data.result;
            const recentWinners = res.data.result;
            if (!recentWinners) return;
            for (const userInfo of recentWinners) {
                let tempNode = document.querySelector('div[data-type="template"]').cloneNode(true);
                tempNode.querySelector('div.detail').textContent = userInfo[1];
                tempNode.insertBefore(document.createTextNode(userInfo[0]), tempNode.querySelector('div'));
                tempNode.style = 'margin: 1px;';
                tempNode.setAttribute('data-type', 'show_winner');
                tempNode.querySelector('i').remove();
                tempNode.classList.remove('teal');
                tempNode.classList.add('green');
                recentWinnerSegment.appendChild(tempNode);
            }
        } catch (e) {
            if (!(e in ERROR_LIST)) e = 'ERROR_CLIENT';
            alert(ERROR_LIST[e].msg);
        }
    }
};