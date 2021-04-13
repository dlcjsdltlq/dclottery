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

let comments = {};
let timeList = {};
let excludeWords = [];
let includeWords = [];
let excludeIpFlag = false;
let logNo = null;

const resetAll = () => {
    let entryElements = [];
    entryElements.push(...document.querySelectorAll('a[data-type="show"]'));
    entryElements.push(...document.querySelectorAll('a[data-type="winner"]'))
    for (const entryElement of entryElements) {
        entryElements[i].parentNode.removeChild(entryElement);
    }
    document.querySelector('#winner-segment').style.display = 'none';
    document.querySelector('#call-id').setAttribute('data-token', '');
    comments = {};
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
        const entries = res.data.result.entries;
        comments = res.data.result.comments;
        timeList = res.data.result.dates;
        const callId = res.data.callId;
        document.querySelector('#call-id').setAttribute('data-token', callId);
        const includeSegment = document.querySelector('#include-segment');
        for (const entryInfo of entries) {
            let tempNode = document.querySelector('a[data-type="template"]').cloneNode(true);
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
    const targetElement = element;
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
    const includeEntriesElements = document.querySelectorAll('#include-segment > a[data-type="show"]');
    const excludeEntriesElements = document.querySelectorAll('#exclude-segment > a[data-type="show"]');
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
        const winners = res.data.result.winners;
        logNo = res.data.result.logNo;
        const winnerSegment = document.querySelector('#winner-segment');
        for (const winner of winners) {
            let winnerBox = document.querySelector(`a[data-id="${winner[1]}"]`).cloneNode(true);
            winnerBox.classList.remove('teal');
            winnerBox.classList.add('blue');
            winnerBox.setAttribute('data-type', 'winner');
            winnerBox.setAttribute('onclick', 'viewComment(this);');
            winnerSegment.appendChild(winnerBox);
            document.querySelector('#call-id').setAttribute('data-token', '');
        }
        const allEntryElements = document.querySelectorAll('a[data-type="show"]');
        for (const entryElement of allEntryElements) entryElement.setAttribute('onclick', '');
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
    document.querySelector('#winner-click-notice').style.display = 'inline';
    document.querySelector('#capture-btn').style.display = 'block';
    window.scrollTo(0, document.body.scrollHeight);
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
                let tempNode = document.querySelector('div[data-type="template_recent"]').cloneNode(true);
                tempNode.querySelector('div.detail').textContent = userInfo[1];
                tempNode.insertBefore(document.createTextNode(userInfo[0]), tempNode.querySelector('div'));
                tempNode.style = 'margin: 1px;';
                tempNode.setAttribute('data-type', 'show_winner');
                recentWinnerSegment.appendChild(tempNode);
            }
        } catch (e) {
            if (!(e in ERROR_LIST)) e = 'ERROR_CLIENT';
            alert(ERROR_LIST[e].msg);
        }
    }
};

const viewComment = (element) => {
    const commentArea = document.querySelector('#view-comment-area');
    const winnerId = element.getAttribute('data-id');
    const winnerNick = element.getAttribute('data-nick');
    const commentLabel = document.createElement('div');
    commentLabel.className += 'ui fluid blue basic label transition hidden';
    const deleteIcon = document.createElement('i');
    deleteIcon.className += 'delete icon';
    deleteIcon.setAttribute('onclick', 'removeCommentBox(this);');
    commentLabel.innerHTML += `${winnerNick}(${winnerId}): ${comments[winnerNick + winnerId]}`;
    commentLabel.appendChild(deleteIcon);
    commentArea.appendChild(commentLabel);
    $(commentLabel).transition('fade');
};

const removeCommentBox = (element) => {
    $(element).parent().transition('fade');
    setTimeout(() => element.parentNode.remove(), 4000);
}

const viewOptionBox = () => {
    const optionBoxElement = document.querySelector('#option-segment');
    optionBoxElement.style.display = optionBoxElement.style.display === 'none' ? 'block' : 'none';
};

const inOrExcludeWord = (option) => {
    const inputElement = document.querySelector(option);
    const text = inputElement.value.trim();
    if (!text || includeWords.includes(text) || excludeWords.includes(text)) return;
    if (option === '#include-word-input') includeWords.push(text);
    else excludeWords.push(text);
    inputElement.value = '';
    const includeWordsElement = document.querySelector('#include-word-list');
    const excludeWordsElement = document.querySelector('#exclude-word-list');
    if (option === '#include-word-input') {
        const wordLabel = document.createElement('div');
        wordLabel.className += 'ui mini blue label';
        const textNode = document.createTextNode(text);
        const deleteIcon = document.createElement('i');
        deleteIcon.classList += 'delete icon';
        deleteIcon.setAttribute('onclick', 'removeWordFromList("include", this);')
        wordLabel.setAttribute('data-word', text)
        wordLabel.appendChild(textNode);
        wordLabel.appendChild(deleteIcon);
        includeWordsElement.appendChild(wordLabel);
    } else {
        const wordLabel = document.createElement('div');
        wordLabel.className += 'ui mini red label';
        const textNode = document.createTextNode(text);
        const deleteIcon = document.createElement('i');
        deleteIcon.classList += 'delete icon';
        deleteIcon.setAttribute('onclick', 'removeWordFromList("exclude", this);')
        wordLabel.setAttribute('data-word', text)
        wordLabel.appendChild(textNode);
        wordLabel.appendChild(deleteIcon);
        excludeWordsElement.appendChild(wordLabel);
    }
};

const removeWordFromList = (option, element) => {
    const word = element.parentNode.getAttribute('data-word');
    const list = eval(option + 'Words')
    const idx = list.indexOf(word);
    if (idx > -1) list.splice(idx, 1);
    element.parentNode.remove();
};

const applyOptions = () => {
    if (!document.querySelector('#call-id').getAttribute('data-token')) return;
    const includeElements = document.querySelectorAll('#include-segment > a[data-type="show"]');
    const timeCut = (new Date(document.querySelector('#time-cut').value)).getTime();
    console.log(timeCut)
    for (const includeElement of includeElements) {
        const nick = includeElement.getAttribute('data-nick');
        const ip = includeElement.getAttribute('data-id');
        const nickAndIp = nick + ip;
        console.log((new Date(timeList[nickAndIp])).getTime());
        if ((excludeIpFlag && ip.includes('.')) || (timeCut < (new Date(timeList[nickAndIp])).getTime())) { toggleExclude(includeElement); continue; }
        const comment = comments[nickAndIp];
        let breakFlag = false;
        for (const includeWord of includeWords) {
            console.log(comment)
            if (!comment.includes(includeWord)) {
                toggleExclude(includeElement);
                breakFlag = true; break;
            }
        }
        if (breakFlag) continue;
        for (const excludeWord of excludeWords) {
            if (comment.includes(excludeWord)) {
                toggleExclude(includeElement);
                break;
            }
        }
    }
};

const resetOptions = () => {
    includeWords = [];
    excludeWords = [];
    excludeIpFlag = false;
    document.querySelector('#ip-allow-checkbox').checked = false;
    const excludeWordElements = document.querySelectorAll('.mini');
    for (const excludeWordElement of excludeWordElements) {
        excludeWordElement.remove();
    }
    const excludeEntries = document.querySelectorAll('#exclude-segment > a');
    for (const excludeEntry of excludeEntries) toggleExclude(excludeEntry);
};

const downloadScreenshot = () => {
    if (logNo !== null) {
        window.location.assign('/api/getscreenshot/' + logNo);
    }
};

(() => {
    document.onreadystatechange = () => {
        if (document.readyState == 'complete') {
            const element = document.querySelector('#time-cut');
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            element.value = now.toISOString().slice(0, 16); 
        }
    }
})();