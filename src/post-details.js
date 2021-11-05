function postDetails() {
    $(document).ready(function () {
        if (window.CONFIG.is_toc) {
            $('#post-toc a').on('click', function (e) {
                e.preventDefault();
                var offset = $(this.getAttribute('href')).offset().top;

                $("#post-toc .current").removeClass("current");
                $(this).addClass('current')
                $('html, body').stop().animate({
                    scrollTop: offset - 120
                }, 500);
            });
        }
        mediumZoom('article img', {
            margin: 24,
            background: '#00000077',
            scrollOffset: 0
        })
    });
}

module.exports = postDetails;
