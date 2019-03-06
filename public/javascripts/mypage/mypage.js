/* Global */

// Side bar
! function (t) {
    "use strict";
    t("#sidebarToggle").click(function (e) {
        e.preventDefault(), t("body").toggleClass("sidebar-toggled"), t(".sidebar").toggleClass("toggled")
    }), t("body.fixed-nav .sidebar").on("mousewheel DOMMouseScroll wheel", function (e) {
        if (768 < $window.width()) {
            var o = e.originalEvent,
                t = o.wheelDelta || -o.detail;
            this.scrollTop += 30 * (t < 0 ? 1 : -1), e.preventDefault()
        }
    }), t(document).scroll(function () {
        100 < t(this).scrollTop() ? t(".scroll-to-top") : t(".scroll-to-top")
    }), t(document).on("click", "a.scroll-to-top", function (e) {
        var o = t(this);
        t("html, body").stop().animate({
            scrollTop: t(o.attr("href")).offset().top
        }, 1e3, "easeInOutExpo"), e.preventDefault()
    })
}(jQuery);

// ToolTip Code
$(function () {
    $('[data-toggle="tooltip"]').tooltip()
});


/* Logout in Mypage, User page*/
function logout() {
    Swal.fire({
        title: 'Ready to Leave?',
        text: `Select "Logout" below if you are ready to end your current session.`,
        type: 'info',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Logout',
        preConfirm: () => {
            return fetch(`/logout`) // Fetch Data from server
                .catch(error => {
                    Swal.fire(
                        'ERROR?',
                        `Error Message : ${error}`,
                        'error'
                    )
                    console.log(error);
                })
        },
    }).then((result) => {
        if (result.value) {
            window.location.href = '/'; // After Login Redirect to Main page
        }
    })
}

