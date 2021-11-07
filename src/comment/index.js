import css from './index.less'
import html from './index.html'
import { detect, createList, pathToData, create, createEmotesNav, createEmotesList, insertAtCaret, escape, unescape } from './libs/util'
import marked from 'marked';
import MD5 from 'md5.js'
import DOMPurify from 'dompurify';
import tcp from './libs/tcb'
const hanabi = require('hanabi');

class ComComment extends HTMLElement {

    constructor() {
        super()
        this._commentList = [];
        this.sending = false;
        this.detect = detect();
        marked.setOptions({
            highlight: hanabi,
            gfm: true,
            tables: true,
            breaks: true,
            pedantic: false,
            sanitize: true,
            smartLists: true,
            smartypants: true
        });

        this.render(this.attachShadow({ mode: 'open' }))
    }

    /**
     * 生成dom
     * @param {*} shadowRoot 
     */
    render(shadowRoot = this.shadowRoot) {
        shadowRoot.innerHTML = `<style>${css}</style>${html}`
        this._event_init(shadowRoot)
    }

    /**
     * 事件绑定
     * @param {*} shadowRoot 
     */
    _event_init(shadowRoot = this.shadowRoot) {
        this.nick_input = shadowRoot.getElementById('nick');
        this.email_input = shadowRoot.getElementById('email');
        this.link_input = shadowRoot.getElementById('link');
        this.emoji_nav = shadowRoot.querySelector('.emojis-container');
        this.emoji_nav.appendChild(createEmotesNav())
        this.emojis_list = shadowRoot.querySelector('.emojis-list')
        this.emotes = {}

        this.textarea = shadowRoot.getElementById("textarea");
        this.sendBtn = shadowRoot.getElementById("send-btn");

        // 编辑框
        this.textarea.addEventListener('click', () => {
            this.lastEditRange = shadowRoot.getSelection().getRangeAt(0)
        })
        /* this.textarea.addEventListener('keyup', () => {
            this.lastEditRange = shadowRoot.getSelection().getRangeAt(0)
        }) */
        this.textarea.addEventListener('blur', () => {
            let editor = shadowRoot.querySelector('.editor-container ')
            if (this.textarea.innerText !== '') {
                editor.classList.remove('placeholder-shown')
            } else {
                editor.classList.add('placeholder-shown')
            }
        })

        //发送
        this.sendBtn.addEventListener('click', () => {
            let comment = this.textarea.innerText;
            let email = this.email_input.value.trim();
            let nick = this.nick_input.value.trim();
            let link = this.link_input.value.trim();

            if (nick.length < 2) {
                this.nick_input.focus(); return;
            }
            if (!/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(email)) {
                this.email_input.focus(); return;
            }
            if (comment == '') {
                this.textarea.focus(); return;
            }

            let avatar = new MD5().update(email).digest('hex');
            // 去掉获取qq头像,直链会暴露qq号
            /* if (/^[1-9][0-9]{6,}@qq.com/.test(email)) {
                let qq = /^[1-9][0-9]{6,}/.exec(email)[0];
                avatar = qq
            } else {
                avatar = new MD5().update(email).digest('hex')
            } */
            let { browser, version, os, osVersion } = this.detect;
            this._send({
                url: location.pathname,
                ua: navigator.userAgent,
                browser: `${browser} ${version}`,
                os: `${os} ${osVersion}`,
                avatar,
                nick: DOMPurify.sanitize(nick),
                email: DOMPurify.sanitize(email),
                link: DOMPurify.sanitize(link),
                content: DOMPurify.sanitize(marked(comment)),
            });

            localStorage.setItem('comment_user_info', JSON.stringify({ nick, email, link }))
        });

        //回复
        shadowRoot.getElementById("comment-list").addEventListener('click', (e) => {
            if (e.target.className == 'comment-reply') {
                let editContainer = e.target.parentElement.parentElement.querySelector(':scope > .comment-edit-container')

                if (editContainer) {
                    editContainer.appendChild(shadowRoot.getElementById('comment-editor'))
                } else {
                    editContainer = create('div', { class: 'comment-edit-container' })
                    editContainer.appendChild(shadowRoot.getElementById('comment-editor'))
                    e.target.parentElement.parentElement.appendChild(editContainer);
                }

                let { topid, id, idxpath } = e.target.dataset;
                let { link = '', nick = '', id: atid = '' } = pathToData(this._commentList, idxpath, 'childer');
                this.atComment = {
                    topID: topid || id,
                    link,
                    nick,
                    id: atid
                }
            }
        })

        //取消
        shadowRoot.getElementById("close-btn").addEventListener('click', (e) => {
            this._cancel_reply()
        })

        // 加载更多
        shadowRoot.getElementById("loadmore").addEventListener('click', (e) => {
            this._morelist()
        })

        // 切换表情列表
        this.emoji_nav.addEventListener('click', (e) => {
            let id = e.target.dataset.package
            if (id) {
                if (!this.emotes[id]) {
                    this.emotes[id] = createEmotesList(e.target.dataset.package).firstElementChild
                }
                for (const key in this.emotes) {
                    this.emotes[key].classList.remove('show')
                }
                if (this.package_id !== id) {
                    this.package_id = id
                    this.emotes[id].classList.add('show')
                    this.emojis_list.appendChild(this.emotes[id])
                } else {
                    this.package_id = null
                }
            }
        })

        // 插入表情
        this.emojis_list.addEventListener('click', (e) => {
            let text = e.target.dataset.text
            if (text) insertAtCaret(this.textarea, text, shadowRoot, this.lastEditRange)
        })

    }

    /**
     * 加载完成
     */
    connectedCallback() {
        if (localStorage.getItem('comment_user_info')) {
            let { nick, email, link } = JSON.parse(localStorage.getItem('comment_user_info'))
            this.nick_input.value = nick == 'Anonymous' ? '' : nick;
            this.email_input.value = email;
            this.link_input.value = link;
        }
        this._init_tcb();
    }

    /**
     * 初始化tcb
     */
    async _init_tcb() {
        let env = this.getAttribute("env");
        let hash = this.getAttribute("hash")
        this._dbs = new tcp(env, hash)

        await this._dbs._init();
        this._morelist()
    }

    /**
     * 加载更改评论
     */
    async _morelist() {
        let shadowRoot = this.shadowRoot;
        let loading = shadowRoot.getElementById("loading");
        let loadmore = shadowRoot.getElementById("loadmore");
        loading.style.display = 'inline-block';
        loadmore.style.display = 'none';

        let data = await this._dbs.getComment();
        this._commentList = this._commentList.concat(data)

        this._listContent = this._listContent || this.shadowRoot.querySelector(".comment-list");
        this._listContent.appendChild(createList(data));

        loading.style.display = 'none';
        if (data.length == 10) {
            loadmore.style.display = 'inline-block';
        } else {
            let h3 = document.createElement("h3");
            h3.innerHTML = '没有更多评论了~'
            this._listContent.appendChild(h3);
        }
    }

    /**
     * 发送信息
     * @param {*} parms 
     */
    async _send(parms) {
        if (!this.sending) {
            this.sending = true;

            parms.istop = !this.atComment;
            if (this.atComment) {
                parms.topID = this.atComment.topID
                parms.at = {
                    ...this.atComment
                }
            }
            let { result } = await this._dbs.addComment(parms);

            //生成dom
            if (result.success) {
                let param = { ...parms, ...result.data }
                if (!this.atComment) {
                    let con = this.shadowRoot.querySelector(".comment-list");
                    let length = con.querySelectorAll('.item-top').length;
                    con.insertBefore(createList([param]), con.children[length])

                    this._commentList.splice(length, 0, param);

                } else {
                    let con = this.shadowRoot.querySelector("#reply" + this.atComment.topID);
                    param._idxpath = this.atComment.topID + ',' + con.children.length
                    con.appendChild(createList([param], this.atComment.topID))
                    let _com = this._commentList.find(item => item.id === this.atComment.topID)
                    if (_com) {
                        _com.childer = _com.childer || []
                        _com.childer.push(param);
                    }
                    this._cancel_reply()
                }
                this.textarea.innerText = ''
            }
            this.sending = false;
        }
    }

    _cancel_reply() {
        this.shadowRoot.querySelector(".comment-edit-container").appendChild(this.shadowRoot.getElementById('comment-editor'));
        this.atComment = null
    }

}

!customElements.get('com-comment') && customElements.define('com-comment', ComComment)
