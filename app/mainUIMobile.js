var mainUI;

class MainUI {
    constructor() {

        this.sideBars = [];

    }
    setupMenu() {

        var viewermenu = [          
            {
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
            },
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
        ];
        if (!myUserManagmentClient.getDemoMode())
        {
          $('#viewermenu1button').contextMenu("menu", viewermenu, {
            'displayAround': 'trigger',
            verAdjust: 130,
            horAdjust: 105
          });
        }
        else
        {
          $('#viewermenu1button').css("display", "none");
          $('.fileUploadButton').css("display", "none");
        }       

        $("[id^=iw-contextMenu]").css("transform","scale(2.5)")
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
        $("#content").css("display", "block");
    }

    toggleExpansion(div) {
        var sidebar = this.sideBars[div];
        $(".sidenav").children().css("color", "");
        if (!sidebar.expanded) {
            this.collapseAll();

            $("#" + div).css({ "display": "block" });
            $("#" + div).css({ "width": "100%" });
            var newwidth = $("#content").width() - (sidebar.width + 50);           
            sidebar.expanded = true;
            $("#" + div + "_button").css("color", "gray");
            $("#content").css("display", "none");
        }
        else {
            this.collapseAll();
        }
        if (sidebar.callback)
            sidebar.callback(sidebar.expanded);    
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