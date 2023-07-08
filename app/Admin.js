var userAccount = "demo@techsoft3d.com";
var userPassword = "demo";
var startHUB = "demo";

const serveraddress = "https://caas.techsoft3d.com:443";
const serveraddressBackup = "https://caas2.techsoft3d.com:443";


var version = "v0.7.5";



class Admin {

    constructor() {
       
        this._updateUICallback = null;
        this._loggedInCallback = null;
     
        this.adminHub = new AdminHub();
        this.adminProject = new AdminProject();

        this.streamingDisabled =  false;

    }

    setStreamingDisabled(disabled) {
        this.streamingDisabled = disabled;
    }

    getStreamingDisabled() {
        return this.streamingDisabled;
    }

    setUpdateUICallback(updateuicallback) {
        this._updateUICallback = updateuicallback;
    }

    setLoggedInCallback(loggedincallback) {
        this._loggedInCallback = loggedincallback;
    }

    _updateUI() {
        if (this._updateUICallback) {
            this._updateUICallback();
        }
    }
   
    async checkLogin() {
    
        if (!await myUserManagmentClient.getConfiguration()) {
            myUserManagmentClient.setServerAddress(serveraddressBackup);
            await myUserManagmentClient.getConfiguration();
        }


        myUserManagmentClient.setUseStreaming(!this.streamingDisabled);

        let success = await myUserManagmentClient.checkLogin();
        if (success) {
            let user = myUserManagmentClient.getCurrentUser();
            if (user && this._loggedInCallback) {
                this._loggedInCallback();
            }
                          
            this.adminProject.loadProject(myUserManagmentClient.getCurrentProject().id);
            this._updateUI();
            return;
        }

        setTimeout(function () {
            showAbout();           
        }, 2000);

        let response = await myUserManagmentClient.login( userAccount,userPassword, true);
        let sessionProject = response.sessionProject;
        $(".loggedinuser").empty();
        $(".loggedinuser").append("");
            
        let models = await myUserManagmentClient.getHubs();
        let hubid = "";
        for (let i=0;i<models.length;i++) {
            if (models[i].name == startHUB) {
                hubid = models[i].id;
                break;
            }
        }

        if (hubid == "") {
            this.adminHub.handleHubSelection();
            return;
        }
        await myUserManagmentClient.loadHub(hubid);    
        $(".loggedinuser").html("");

      
        await myUserManagmentClient.loadProject(sessionProject);    

        $(".modal-backdrop").remove();
        if ( this.adminProject._loadProjectCallback) {
            this.adminProject._loadProjectCallback();
        }

        myAdmin._updateUI();
    }

    async handleLogout()
    {
        await myUserManagmentClient.logout();
        window.location.reload(true); 

    }

  
    handleRegistration() {
        let myModal = new bootstrap.Modal(document.getElementById('registerusermodal'));
        myModal.toggle();
    }

    async _submitRegistration() {

        let res = await myUserManagmentClient.register({firstName: $("#register_firstname").val(), lastName: $("#register_lastname").val(), email: $("#register_email").val(), password: $("#register_password").val()});
        if (res == "SUCCESS") {
            CsManagerClient.msready();
        }
        else {
            $.notify("Error: " + res, { style:"notifyerror",autoHideDelay: 3000, position: "bottom center" });
            myAdmin.handleRegistration();
        }   
    }

    handleLogin() {      
        let myModal = new bootstrap.Modal(document.getElementById('loginusermodal'));
        myModal.show();

        var input = document.getElementById("login_password");
        input.addEventListener("keyup", function(event) {
            // Number 13 is the "Enter" key on the keyboard
            if (event.keyCode === 13) {
              // Cancel the default action, if needed
              event.preventDefault();
              // Trigger the button element with a click
              document.getElementById("loginbutton").click();
            }
          });
    }

    async _submitLogin() {
        let response = await myUserManagmentClient.login( $("#login_email").val(), $("#login_password").val());

        if (response.ERROR) {
            myAdmin.handleLogin();
            $.notify("Error: " + response.ERROR, { style:"notifyerror",autoHideDelay: 3000, position: "bottom center" });
        }
        else {
            $(".loggedinuser").empty();
            $(".loggedinuser").append(response.user.email);
            this.adminHub.handleHubSelection();
            this._updateUI();

            if (myUserManagmentClient.getCurrentUser() && this._loggedInCallback) {
                this._loggedInCallback();
            }
        }
    }
}

