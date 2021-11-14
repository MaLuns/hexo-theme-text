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

        $("article img").each(function () {
            var element = document.createElement("span");
            $(element).attr("data-fancybox", "gallery");
            $(element).attr("href", $(this).attr("src"));
            $(this).wrap(element);
        })
    });
}

module.exports = postDetails;
