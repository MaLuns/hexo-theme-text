$(function () {
    const app = {
        setting: localStorage.getItem('setting') ? JSON.parse(localStorage.getItem('setting')) : {},
        initSettingEvent() {
            let root = document.documentElement;
            let _setTimeout;

            $("#back-top").on("click", function () {
                window.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            })

            $("#lightSwitch").on('click', function (ev) {
                let that = $(ev.delegateTarget)
                let checked = that.hasClass('theme-toggle--checked')
                let funKey = (checked ? 'remove' : 'add')
                that[funKey + 'Class']('theme-toggle--checked')
                root.classList[funKey]('dark')
                app.setSetting('lightSwitch', checked)

                let bg = $('#light-switch-mark')
                if (_setTimeout) {
                    bg.removeClass('active')
                    clearTimeout(_setTimeout)
                    _setTimeout = null
                }
                bg.addClass('active')
                _setTimeout = setTimeout(() => {
                    bg.removeClass('active')
                    _setTimeout = null
                }, 300);
            })
        },
        LoadMore() {
            if (!!window.IndexConfig && !IndexConfig.loadMore && IndexConfig.current < IndexConfig.total) {
                IndexConfig.loadMore = true;
                $("#loader").addClass('loading').removeClass('loaded')
                $.ajax({
                    url: IndexConfig.url + 'page/' + (++IndexConfig.current),
                    success: function (res) {
                        var result = $(res).find("article");
                        $("#posts").append(result.fadeIn(5000))
                    },
                    error: function () {
                        --IndexConfig.current;
                    },
                    complete: function () {
                        IndexConfig.loadMore = false;
                        $("#loader").addClass('loaded').removeClass('loading')
                    }
                })
            }
        },
        initSetting() {
            let setting = this.setting;
            for (const key in setting) {
                switch (key) {
                    case 'lightSwitch':
                        if (setting[key] === false || setting[key] === 'false') {
                            $("#lightSwitch").addClass('theme-toggle--checked')
                        } else {
                            $("#lightSwitch").removeClass('theme-toggle--checked')
                        }
                        break
                    case 'filterColor':
                    case 'radiusSlider':
                    case 'boxShadowBlur':
                    case 'fontFamily':
                    /* case 'themeColorPicker':
                        document.getElementById(key).value = setting[key].val;
                        break */
                    default:
                        break
                }

            }
        },
        setSetting(key, value) {
            this.setting[key] = value;
            localStorage.setItem('setting', JSON.stringify(this.setting))
        },
        scroll() {
            let root = document.documentElement;

            var htmlHeight = document.body.scrollHeight || root.scrollHeight;
            var clientHeight = $(window).height() + 100;
            var scrollTop = document.body.scrollTop || root.scrollTop;

            if (scrollTop + clientHeight > htmlHeight) {
                app.LoadMore();
            }

            if (window.CONFIG.fixed_header) {
                if (scrollTop > 80) {
                    $(".layout-header").addClass('show')
                    //$(".layout-header_placeholder").addClass('show')
                } else {
                    $(".layout-header").removeClass('show')
                    //$(".layout-header_placeholder").removeClass('show')
                }
            }

            if (scrollTop > 500) {
                $("#back-top").addClass("show")
            } else {
                $("#back-top").removeClass("show")
            }

            if (window.CONFIG.is_toc) {
                app.toc()
            }
        },
        toc() {
            let post = document.getElementsByClassName("post-content")[0]
            if (post) {
                let titles = post.querySelectorAll('h1,h2,h3,h4,h5,h6')
                let scrollY = window.scrollY
                for (let index = 0; index < titles.length; index++) {
                    let element = titles[index];
                    let nextElement = titles[index + 1];
                    if (element.offsetTop <= scrollY + 120 && (!nextElement || nextElement.offsetTop - 120 > scrollY)) {
                        $("#post-toc .current").removeClass("current");
                        $('a[href="#' + element.id + '"]').addClass('current')
                        break
                    }
                }
            }
        }
    }

    $(window).scroll(app.scroll)

    app.initSetting();
    app.initSettingEvent();
    app.scroll();

})