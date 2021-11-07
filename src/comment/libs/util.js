import DOMPurify from 'dompurify';
import { emojis } from '../emojis'

export const regTest = (reg) => (str) => reg.test(str)

export const getAvatarSrc = (avatar, tag) => {
    let { gravatar, qq } = window.CONFIG.avatar
    if (avatar.length == 32) {
        return gravatar + avatar + '?d=mp'
    }
    if (/^[1-9][0-9]{6,}/.test(avatar)) {
        return qq + `&nk=${avatar}`
    }
    if (tag) {
        return '/images/c_avatar_2.png'
    }
    return '/images/c_avatar.png'
}

/**
 * 生成评论dom列表
 * @param {*} data 
 */
export const createList = (data, parentid, idxpath) => {
    const fragment = document.createDocumentFragment();
    const rtest = regTest(/^https?\:\/\//);

    data.forEach((item, index) => {
        let { id, avatar, link, nick, date, browser, os, at, childer, content, tag, top = false, _idxpath } = item;
        let topID = parentid || id;
        let ipath = _idxpath || (idxpath == undefined ? id : idxpath + ',' + index);

        let commentItemDom = create('div', { class: `comment-item ${item.top ? 'item-top' : ''}`, id })
        let userAvatar = create('img', { class: 'comment-user-avatar', src: getAvatarSrc(avatar, tag) });
        let userCommentDom = create('div', { class: "comment-user-container" })

        let userInfo = create('div', { class: "comment-user-info" })
        let links = link ? rtest(link) ? link : 'http://' + link : ''
        userInfo.innerHTML += `${links ? `<a class="comment-user-nick" rel="nofollow" href="${links}" target="_blank">${nick}</a>` : `<span class="comment-user-nick">${nick}</span>`}`
        userInfo.innerHTML += tag ? `<span class="comment-user-tag">${tag}</span>` : ''
        userInfo.innerHTML += top ? `<span class="comment-user-top">置顶</span>` : ''
        userInfo.innerHTML += `<span class="comment-user-sys">${browser}</span><span class="comment-user-sys">${os}</span>`

        let userMeta = create('div', { class: "comment-user-meta" })
        userMeta.innerHTML = `<span class="comment-time">${timeAgo(new Date(date))}</span><span class="comment-reply" data-topid='${topID}' data-idxpath='${ipath}' data-id='${id}'>回复</span>`

        let userText = create('div', { class: "comment-user-text", id: 'content' + id })
        let atlink = at ? (rtest(at.link) ? at.link : 'http://' + at.link) : ''

        let replyLinkDom = at ? `<div>${!!atlink ? `<a class="comment-replylink" rel="nofollow" href="${atlink}" target="_blank">@${at.nick}</a>` : `<span class="comment-replylink">@${at.nick}</span>`}</div>` : ''
        userText.innerHTML = replyLinkDom + replaceEmote(DOMPurify.sanitize(content));

        appendChild(userCommentDom, userInfo, userMeta, userText)
        if (childer) {
            let replyContainer = create('div', { class: "comment-reply-container", id: 'reply' + id })
            replyContainer.appendChild(createList(childer, topID, ipath))
            appendChild(userCommentDom, replyContainer)
        }

        appendChild(commentItemDom, userAvatar, userCommentDom);
        fragment.appendChild(commentItemDom)
    })

    return fragment;
}

/**
 * 替换表情
 * @param {*} str 
 * @returns 
 */
export const replaceEmote = (str) => {
    return str.replace(/\[[\u4E00-\u9FA5A-Za-z0-9_]{0,}\]/g, function (t) {
        return createEmote(t)
    })
}

/**
 * 
 * @param {*} data 数据源
 * @param {*} path 路径
 * @param {*} key  key
 */
export const pathToData = (data, path, key = '') => {
    path = path.split(',')

    let item = data.find(i => i.id == path[0]);
    if (path.length > 1) {
        return item[key][path[1]]
    } else {
        return item;
    }
}

/**
 * 表情tabs
 * @returns 
 */
export const createEmotesNav = () => {
    const fragment = document.createDocumentFragment();
    emojis.forEach(item => {
        let { id, text, url, emote } = item
        let nav = create('nav', {
            'data-package': id,
            class: "emoji-nav"
        })

        appendChild(nav, create('img', {
            'data-package': id,
            title: text,
            alt: text,
            draggable: false,
            referrerpolicy: "no-referrer",
            src: url + '@112w_112h.webp',
        }))

        fragment.appendChild(nav)
    })

    return fragment
}

/**
 * 表情包列表
 * @param {*} packageid 
 * @returns 
 */
export const createEmotesList = (packageid) => {
    const fragment = document.createDocumentFragment();
    const { emote = [] } = emojis.find(item => item.id === parseInt(packageid)) || {}
    const section = create('section', { id: "emote_" + packageid })
    emote.forEach(item => {
        let i = create('i', {
            class: "emoji-text emoji-pic",
            'data-text': item.text,
        })
        appendChild(i, create('img', {
            referrerpolicy: "no-referrer",
            'data-text': item.text,
            draggable: false,
            src: item.gif_url || item.url,
        }))
        section.appendChild(i)
    })
    fragment.appendChild(section)
    return fragment
}

/**
 * 文本转表情
 * @param {*} text 
 * @returns 
 */
export const createEmote = (text) => {
    let emotes = []
    emojis.forEach(item => {
        emotes.push(...item.emote)
    })
    let emote = emotes.find(item => item.text === text)
    if (emote) {
        return `<i class="emoji-text emoji-pic"><img src="${emote.gif_url || emote.url}" draggable="false" referrerpolicy="no-referrer"/></i>`
    }
    return text
}

/**
 * 插入表情到光标处
 * @param {*} edit 
 * @param {*} val 
 * @param {*} shadowRoot 
 * @param {*} lastEditRange 
 */
export const insertAtCaret = (edit, val, shadowRoot, lastEditRange) => {
    // 编辑框设置焦点
    edit.focus()
    // 获取选定对象
    var selection = shadowRoot.getSelection()
    // 判断是否有最后光标对象存在
    if (lastEditRange) {
        // 存在最后光标对象，选定对象清除所有光标并添加最后光标还原之前的状态
        selection.removeAllRanges()
        selection.addRange(lastEditRange)
    }

    // 判断选定对象范围是编辑框还是文本节点
    if (selection.anchorNode.nodeName != '#text') {
        // 如果是编辑框范围。则创建表情文本节点进行插入
        var emojiText = document.createTextNode(val)

        if (edit.childNodes.length > 0) {
            // 如果文本框的子元素大于0，则表示有其他元素，则按照位置插入表情节点
            for (var i = 0; i < edit.childNodes.length; i++) {
                if (i == selection.anchorOffset) {
                    edit.insertBefore(emojiText, edit.childNodes[i])
                }
            }
        } else {
            // 否则直接插入一个表情元素
            edit.appendChild(emojiText)
        }
        // 创建新的光标对象
        var range = document.createRange()
        // 光标对象的范围界定为新建的表情节点
        range.selectNodeContents(emojiText)
        // 光标位置定位在表情节点的最大长度
        range.setStart(emojiText, emojiText.length)
        // 使光标开始和光标结束重叠
        range.collapse(true)
        // 清除选定对象的所有光标对象
        selection.removeAllRanges()
        // 插入新的光标对象
        selection.addRange(range)
    } else {
        // 如果是文本节点则先获取光标对象
        var range = selection.getRangeAt(0)
        // 获取光标对象的范围界定对象，一般就是textNode对象
        var textNode = range.startContainer;
        // 获取光标位置
        var rangeStartOffset = range.startOffset;
        // 文本节点在光标位置处插入新的表情内容
        textNode.insertData(rangeStartOffset, val)
        // 光标移动到到原来的位置加上新内容的长度
        range.setStart(textNode, rangeStartOffset + val.length)
        // 光标开始和光标结束重叠
        range.collapse(true)
        // 清除选定对象的所有光标对象
        selection.removeAllRanges()
        // 插入新的光标对象
        selection.addRange(range)
    }
    // 无论如何都要记录最后光标对象
    lastEditRange = selection.getRangeAt(0)
}

/**
 * 创建dom
 * @param {*} name 
 * @param {*} attrs 
 */
export const create = (name, attrs) => {
    let el = document.createElement(name)
    addAttr(el, attrs)
    return el
}

/**
 * 添加属性
 * @param {*} el 
 * @param {*} attrs 
 */
export const addAttr = (el, attrs) => {
    for (const key in attrs) {
        if (attrs.hasOwnProperty(key)) {
            el.setAttribute(key, attrs[key])
        }
    }
}

/**
 * 
 * @param {*} el 
 * @param {*} childers 
 */
const appendChild = (el, ...childers) => {
    childers.forEach(element => {
        el.appendChild(element)
    });
}

/**
 * 
 * @param {*} date 
 */
export const timeAgo = (date) => {
    if (date) {
        try {
            var oldTime = date.getTime();
            var currTime = new Date().getTime();
            var diffValue = currTime - oldTime;

            var days = Math.floor(diffValue / (24 * 3600 * 1000));
            if (days === 0) {
                //计算相差小时数
                var leave1 = diffValue % (24 * 3600 * 1000); //计算天数后剩余的毫秒数
                var hours = Math.floor(leave1 / (3600 * 1000));
                if (hours === 0) {
                    //计算相差分钟数
                    var leave2 = leave1 % (3600 * 1000); //计算小时数后剩余的毫秒数
                    var minutes = Math.floor(leave2 / (60 * 1000));
                    if (minutes === 0) {
                        //计算相差秒数
                        var leave3 = leave2 % (60 * 1000); //计算分钟数后剩余的毫秒数
                        var seconds = Math.round(leave3 / 1000);
                        return seconds + `秒前`;
                    }
                    return minutes + `分钟前`;
                }
                return hours + `小时前`;
            }
            if (days < 0) return '刚刚';

            if (days < 8) {
                return days + `天前`;
            } else {
                return format(date, 'yyyy-MM-dd hh:mm')
            }
        } catch (error) {
            console.log(error)
        }
    }
}


/**
 * 格式时间
 * @param {*} time 
 * @param {*} fmt 
 * @returns 
 */
export const format = (time, fmt) => {
    let o = {
        'M+': time.getMonth() + 1, // 月份
        'd+': time.getDate(), // 日
        'h+': time.getHours(), // 小时
        'm+': time.getMinutes(), // 分
        's+': time.getSeconds(), // 秒
        'q+': Math.floor((time.getMonth() + 3) / 3), // 季度
        'S': time.getMilliseconds() // 毫秒
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (time.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp('(' + k + ')').test(fmt)) {
            fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length));
        }
    }
    return fmt;
};

/**
 * 获取浏览器标识信息
 */
export const detect = (u = navigator.userAgent) => {
    let info = {
        device: 'PC',
        osVersion: '',
        version: ''
    }
    var match = {
        //内核
        'Trident': u.indexOf('Trident') > -1 || u.indexOf('NET CLR') > -1,
        'Presto': u.indexOf('Presto') > -1,
        'WebKit': u.indexOf('AppleWebKit') > -1,
        'Gecko': u.indexOf('Gecko/') > -1,
        //浏览器
        'Safari': u.indexOf('Safari') > -1,
        'Chrome': u.indexOf('Chrome') > -1 || u.indexOf('CriOS') > -1,
        'IE': u.indexOf('MSIE') > -1 || u.indexOf('Trident') > -1,
        'Edge': u.indexOf('Edge') > -1,
        'Firefox': u.indexOf('Firefox') > -1 || u.indexOf('FxiOS') > -1,
        'Firefox Focus': u.indexOf('Focus') > -1,
        'Chromium': u.indexOf('Chromium') > -1,
        'Opera': u.indexOf('Opera') > -1 || u.indexOf('OPR') > -1,
        'Vivaldi': u.indexOf('Vivaldi') > -1,
        'Yandex': u.indexOf('YaBrowser') > -1,
        'Kindle': u.indexOf('Kindle') > -1 || u.indexOf('Silk/') > -1,
        '360': u.indexOf('360EE') > -1 || u.indexOf('360SE') > -1,
        'UC': u.indexOf('UC') > -1 || u.indexOf(' UBrowser') > -1,
        'QQBrowser': u.indexOf('QQBrowser') > -1,
        'QQ': u.indexOf('QQ/') > -1,
        'Baidu': u.indexOf('Baidu') > -1 || u.indexOf('BIDUBrowser') > -1,
        'Maxthon': u.indexOf('Maxthon') > -1,
        'Sogou': u.indexOf('MetaSr') > -1 || u.indexOf('Sogou') > -1,
        'LBBROWSER': u.indexOf('LBBROWSER') > -1,
        '2345Explorer': u.indexOf('2345Explorer') > -1,
        'TheWorld': u.indexOf('TheWorld') > -1,
        'XiaoMi': u.indexOf('MiuiBrowser') > -1,
        'Quark': u.indexOf('Quark') > -1,
        'Qiyu': u.indexOf('Qiyu') > -1,
        'Wechat': u.indexOf('MicroMessenger') > -1,
        'Taobao': u.indexOf('AliApp(TB') > -1,
        'Alipay': u.indexOf('AliApp(AP') > -1,
        'Weibo': u.indexOf('Weibo') > -1,
        'Douban': u.indexOf('com.douban.frodo') > -1,
        'Suning': u.indexOf('SNEBUY-APP') > -1,
        'iQiYi': u.indexOf('IqiyiApp') > -1,
        //系统或平台
        'Windows': u.indexOf('Windows') > -1,
        'Linux': u.indexOf('Linux') > -1 || u.indexOf('X11') > -1,
        'Mac OS': u.indexOf('Macintosh') > -1,
        'Android': u.indexOf('Android') > -1 || u.indexOf('Adr') > -1,
        'Ubuntu': u.indexOf('Ubuntu') > -1,
        'FreeBSD': u.indexOf('FreeBSD') > -1,
        'Debian': u.indexOf('Debian') > -1,
        'Windows Phone': u.indexOf('IEMobile') > -1 || u.indexOf('Windows Phone') > -1,
        'BlackBerry': u.indexOf('BlackBerry') > -1 || u.indexOf('RIM') > -1,
        'MeeGo': u.indexOf('MeeGo') > -1,
        'Symbian': u.indexOf('Symbian') > -1,
        'iOS': u.indexOf('like Mac OS X') > -1,
        'Chrome OS': u.indexOf('CrOS') > -1,
        'WebOS': u.indexOf('hpwOS') > -1,
        //设备
        'Mobile': u.indexOf('Mobi') > -1 || u.indexOf('iPh') > -1 || u.indexOf('480') > -1,
        'Tablet': u.indexOf('Tablet') > -1 || u.indexOf('Pad') > -1 || u.indexOf('Nexus 7') > -1
    };

    //基本信息
    var hash = {
        engine: ['WebKit', 'Trident', 'Gecko', 'Presto'],
        browser: ['Safari', 'Chrome', 'Edge', 'IE', 'Firefox', 'Firefox Focus', 'Chromium', 'Opera', 'Vivaldi', 'Yandex', 'Kindle', '360', 'UC', 'QQBrowser', 'QQ', 'Baidu', 'Maxthon', 'Sogou', 'LBBROWSER', '2345Explorer', 'TheWorld', 'XiaoMi', 'Quark', 'Qiyu', 'Wechat', 'Taobao', 'Alipay', 'Weibo', 'Douban', 'Suning', 'iQiYi'],
        os: ['Windows', 'Linux', 'Mac OS', 'Android', 'Ubuntu', 'FreeBSD', 'Debian', 'iOS', 'Windows Phone', 'BlackBerry', 'MeeGo', 'Symbian', 'Chrome OS', 'WebOS'],
        device: ['Mobile', 'Tablet']
    };

    for (var s in hash) {
        for (var i = 0; i < hash[s].length; i++) {
            var value = hash[s][i];
            if (match[value]) {
                info[s] = value;
            }
        }
    }

    //系统版本信息
    var osVersion = {
        'Windows': function () {
            var v = u.replace(/^.*Windows NT ([\d.]+);.*$/, '$1');
            var hash = {
                '6.4': '10',
                '6.3': '8.1',
                '6.2': '8',
                '6.1': '7',
                '6.0': 'Vista',
                '5.2': 'XP',
                '5.1': 'XP',
                '5.0': '2000'
            };
            return hash[v] || v;
        },
        'Android': function () {
            return u.replace(/^.*Android ([\d.]+);.*$/, '$1');
        },
        'iOS': function () {
            return u.replace(/^.*OS ([\d_]+) like.*$/, '$1').replace(/_/g, '.');
        },
        'Debian': function () {
            return u.replace(/^.*Debian\/([\d.]+).*$/, '$1');
        },
        'Windows Phone': function () {
            return u.replace(/^.*Windows Phone( OS)? ([\d.]+);.*$/, '$2');
        },
        'Mac OS': function () {
            return u.replace(/^.*Mac OS X ([\d_]+).*$/, '$1').replace(/_/g, '.');
        },
        'WebOS': function () {
            return u.replace(/^.*hpwOS\/([\d.]+);.*$/, '$1');
        }
    }

    if (osVersion[info.os]) {
        info.osVersion = osVersion[info.os]();
        if (info.osVersion == u) {
            info.osVersion = '';
        }
    }

    //浏览器版本信息
    var version = {
        'Safari': function () {
            return u.replace(/^.*Version\/([\d.]+).*$/, '$1');
        },
        'Chrome': function () {
            return u.replace(/^.*Chrome\/([\d.]+).*$/, '$1').replace(/^.*CriOS\/([\d.]+).*$/, '$1');
        },
        'IE': function () {
            return u.replace(/^.*MSIE ([\d.]+).*$/, '$1').replace(/^.*rv:([\d.]+).*$/, '$1');
        },
        'Edge': function () {
            return u.replace(/^.*Edge\/([\d.]+).*$/, '$1');
        },
        'Firefox': function () {
            return u.replace(/^.*Firefox\/([\d.]+).*$/, '$1').replace(/^.*FxiOS\/([\d.]+).*$/, '$1');
        },
        'Firefox Focus': function () {
            return u.replace(/^.*Focus\/([\d.]+).*$/, '$1');
        },
        'Chromium': function () {
            return u.replace(/^.*Chromium\/([\d.]+).*$/, '$1');
        },
        'Opera': function () {
            return u.replace(/^.*Opera\/([\d.]+).*$/, '$1').replace(/^.*OPR\/([\d.]+).*$/, '$1');
        },
        'Vivaldi': function () {
            return u.replace(/^.*Vivaldi\/([\d.]+).*$/, '$1');
        },
        'Yandex': function () {
            return u.replace(/^.*YaBrowser\/([\d.]+).*$/, '$1');
        },
        'Kindle': function () {
            return u.replace(/^.*Version\/([\d.]+).*$/, '$1');
        },
        'Maxthon': function () {
            return u.replace(/^.*Maxthon\/([\d.]+).*$/, '$1');
        },
        'QQBrowser': function () {
            return u.replace(/^.*QQBrowser\/([\d.]+).*$/, '$1');
        },
        'QQ': function () {
            return u.replace(/^.*QQ\/([\d.]+).*$/, '$1');
        },
        'Baidu': function () {
            return u.replace(/^.*BIDUBrowser[\s\/]([\d.]+).*$/, '$1');
        },
        'UC': function () {
            return u.replace(/^.*UC?Browser\/([\d.]+).*$/, '$1');
        },
        'Sogou': function () {
            return u.replace(/^.*SE ([\d.X]+).*$/, '$1').replace(/^.*SogouMobileBrowser\/([\d.]+).*$/, '$1');
        },
        '2345Explorer': function () {
            return u.replace(/^.*2345Explorer\/([\d.]+).*$/, '$1');
        },
        'TheWorld': function () {
            return u.replace(/^.*TheWorld ([\d.]+).*$/, '$1');
        },
        'XiaoMi': function () {
            return u.replace(/^.*MiuiBrowser\/([\d.]+).*$/, '$1');
        },
        'Quark': function () {
            return u.replace(/^.*Quark\/([\d.]+).*$/, '$1');
        },
        'Qiyu': function () {
            return u.replace(/^.*Qiyu\/([\d.]+).*$/, '$1');
        },
        'Wechat': function () {
            return u.replace(/^.*MicroMessenger\/([\d.]+).*$/, '$1');
        },
        'Taobao': function () {
            return u.replace(/^.*AliApp\(TB\/([\d.]+).*$/, '$1');
        },
        'Alipay': function () {
            return u.replace(/^.*AliApp\(AP\/([\d.]+).*$/, '$1');
        },
        'Weibo': function () {
            return u.replace(/^.*weibo__([\d.]+).*$/, '$1');
        },
        'Douban': function () {
            return u.replace(/^.*com.douban.frodo\/([\d.]+).*$/, '$1');
        },
        'Suning': function () {
            return u.replace(/^.*SNEBUY-APP([\d.]+).*$/, '$1');
        },
        'iQiYi': function () {
            return u.replace(/^.*IqiyiVersion\/([\d.]+).*$/, '$1');
        }
    };

    if (version[info.browser]) {
        info.version = version[info.browser]();
        if (info.version == u) {
            info.version = '';
        }
    }

    //修正
    if (info.browser == 'Edge') {
        info.engine = 'EdgeHTML';
    } else if (info.browser == 'Chrome' && parseInt(info.version) > 27) {
        info.engine = 'Blink';
    } else if (info.browser == 'Opera' && parseInt(info.version) > 12) {
        info.engine = 'Blink';
    } else if (info.browser == 'Yandex') {
        info.engine = 'Blink';
    } else if (info.browser == undefined) {
        info.browser = 'Unknow App'
    }

    return info;
}

const unescapeMap = {};
const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#x60;',
    "\\": '&#x5c;'
};
for (let key in escapeMap) {
    unescapeMap[escapeMap[key]] = key;
}

const reUnescapedHtml = /[&<>"'`\\]/g
const reHasUnescapedHtml = RegExp(reUnescapedHtml.source)
const reEscapedHtml = /&(?:amp|lt|gt|quot|#39|#x60|#x5c);/g
const reHasEscapedHtml = RegExp(reEscapedHtml.source)

export const escape = (s) => (s && reHasUnescapedHtml.test(s)) ? s.replace(reUnescapedHtml, (chr) => escapeMap[chr]) : s

export const unescape = (s) => (s && reHasEscapedHtml.test(s)) ? s.replace(reEscapedHtml, (entity) => unescapeMap[entity]) : s
