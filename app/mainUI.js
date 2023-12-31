var mainUI;

class MainUI {
    constructor() {

        this.sideBars = [];

    }
    setupMenu() {

        let viewermenu = [];
        if (!getUrlParameter("serverurl")) {
            viewermenu.push({
                name: localStorage.getItem("CSDA-DISABLESTREAMING") == 'true' ? 'Enable Streaming' : 'Disable Streaming',
                fun: async function () {
                    switchStreaming();
                }
            },
                {
                    name: 'Reset Demo Project',
                    fun: async function () {
                        myAdmin.handleLogout();
                    }
                }
            );
        }

        viewermenu.push(
            {
                name: 'Help',
                fun: async function () {
                    showHelp();
                }
            },
            {
                name: 'About',
                fun: async function () {
                    showAbout();
                }
            }
        );
        
        if (!myUserManagmentClient.getDemoMode()) {
            if (md.mobile()) {
                $('#viewermenu1button').contextMenu("menu", viewermenu, {
                    'displayAround': 'trigger',
                    verAdjust: 130,
                    horAdjust: 105
                });
            }
            else {
                $('#viewermenu1button').contextMenu("menu", viewermenu, {
                    'displayAround': 'trigger',
                    verAdjust: 30,
                    horAdjust: -35
                });
            }
        }
        else {
            $('#viewermenu1button').css("display", "none");
            $('.fileUploadButton').css("display", "none");
        }

        if (md.mobile()) {
            $("[id^=iw-contextMenu]").css("transform", "scale(2.5)")
        }

    }

    registerSideBars(div, width, callback) {
        this.sideBars[div] = { width: width, expanded: false, callback: callback };
    }

    collapseAll() {
        for (var i in this.sideBars) {
            $("#" + i).css({ "display": "none" });
            this.sideBars[i].expanded = false;
            $("#" + i + "_button").css("color", "lightgray");
        }
        if (md.mobile()) {
             $("#content").css("display", "block");
        }
        else {
            $("#content").css("margin-left", "40px");
            $("#content").css({ "width": "" });
        }
    }

    toggleExpansion(div) {
        var sidebar = this.sideBars[div];
        $(".sidenav").children().css("color", "");
        if (!sidebar.expanded) {
            this.collapseAll();
            if (md.mobile()) {

                $("#" + div).css({ "display": "block" });
                $("#" + div).css({ "width": "100%" });
                var newwidth = $("#content").width() - (sidebar.width + 50);
                sidebar.expanded = true;
                $("#" + div + "_button").css("color", "gray");
                $("#content").css("display", "none");

            }
            else {
                $("#content").css("margin-left", "");
                $("#content").css({ "width": "" });

                $("#" + div).css({ "display": "block" });
                $("#" + div).css({ "width": sidebar.width + "px" });
                var newwidth = $("#content").width() - (sidebar.width + 50);

                $("#content").css("margin-left", (sidebar.width + 40) + "px");
                $("#content").css({ "width": newwidth + "px" });
                sidebar.expanded = true;
                $("#" + div + "_button").css("color", "gray");
            }
        }
        else {
            this.collapseAll();
        }
        if (sidebar.callback) {
            sidebar.callback(sidebar.expanded);
        }

        if(!md.mobile()) {
            resizeCanvas();
        }
    }

    updateMenu() {
        
        if (!myUserManagmentClient.getCurrentUser()) {
            $("li:contains(Logout)").css("opacity", "0.2");
            $("li:contains(Logout)").css("pointer-events", "none");

            $("li:contains(Register)").css("opacity", "1.0");
            $("li:contains(Register)").css("pointer-events", "all");


            $("li:contains(Login)").css("opacity", "1.0");
            $("li:contains(Login)").css("pointer-events", "all");

            $("li:contains(Switch Project)").css("opacity", "0.2");
            $("li:contains(Switch Project)").css("pointer-events", "none");

            $("li:contains(Switch Hub)").css("opacity", "0.2");
            $("li:contains(Switch Hub)").css("pointer-events", "none");
        }
        if (myUserManagmentClient.getCurrentUser()) {

            $("li:contains(Logout)").css("opacity", "1.0");
            $("li:contains(Logout)").css("pointer-events", "all");

            $("li:contains(Login)").css("opacity", "0.2");
            $("li:contains(Login)").css("pointer-events", "none");

            $("li:contains(Switch Project)").css("opacity", "1");
            $("li:contains(Switch Project)").css("pointer-events", "all");

            $("li:contains(Switch Hub)").css("opacity", "1");
            $("li:contains(Switch Hub)").css("pointer-events", "all");

            $("li:contains(Register)").css("opacity", "0.2");
            $("li:contains(Register)").css("pointer-events", "none");
        }

        if (myUserManagmentClient.getCurrentProject()) {
            $("#content").css("display", "block");
            $("body").css("background", "");
            $(".sidenav").css("pointer-events", "");
        }
        else {
            $("#content").css("display", "none");
            $("body").css("background", "grey");
            $(".sidenav").css("pointer-events", "none");

        }
    }
}