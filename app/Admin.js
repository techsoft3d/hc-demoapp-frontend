class Admin {

    constructor() {    
        this._updateUICallback = null;
        this._loggedInCallback = null;
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

    setLoadProjectCallback(loadprojectcallback) {
        this._loadProjectCallback = loadprojectcallback;
    }

    async loadProject(projectid) {

        await myUserManagmentClient.loadProject(projectid);
        this._updateUI();
        if (this._loadProjectCallback) {
            this._loadProjectCallback();
        }
    }
   
    async checkLogin() {
    
        if (!await myUserManagmentClient.getConfiguration()) {
            myUserManagmentClient.setServerAddress(serveraddressBackup);
            await myUserManagmentClient.getConfiguration();
        }


        myUserManagmentClient.setUseStreaming(!this.streamingDisabled);

        let success = await myUserManagmentClient.checkLogin();
        if (success && myUserManagmentClient.getCurrentProject()) {
            let user = myUserManagmentClient.getCurrentUser();
            if (user && this._loggedInCallback) {
                this._loggedInCallback();
            }

            
                          
            this.loadProject(myUserManagmentClient.getCurrentProject().id);
            this._updateUI();
            return;
        }

        setTimeout(function () {
            showAbout();           
        }, 2000);

        let response = await myUserManagmentClient.login(null,null, true);
        let sessionProject = response.sessionProject;
        $(".loggedinuser").empty();
        $(".loggedinuser").append("");
            
    
        $(".loggedinuser").html("");
      
        await myUserManagmentClient.loadProject(sessionProject);    

        $(".modal-backdrop").remove();
        if (this._loadProjectCallback) {
            this._loadProjectCallback();
        }

        myAdmin._updateUI();
    }

    async handleLogout()
    {
        await myUserManagmentClient.logout();
        window.location.reload(true); 

    }
  
}

