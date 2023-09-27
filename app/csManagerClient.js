class CsManagerClient {
    static _dropZone;

    constructor() {
        this._updatedTime = undefined;
        this._modelHash = [];
        this._firstLoad = true;
        this._checkForNewModelsPending = false;
        this._checkInterval = null;
    }

    async chooseZipContent(file, cb) {
        let _this = this;
        this._cb = cb;
        this._zipViewActive = true;
        this._zipFile = file;
        $("#standarduploaddiv").css('display', 'none');
        $("#dropzonewrapper").css('display', 'none');
        $("#zipcontentdiv").css('display', 'block');
        let entries = await (new zip.ZipReader(new zip.BlobReader(file))).getEntries();
        this.zipTable.clearData();

        for (let i = 0; i < entries.length; i++) {
            if (!entries[i].directory) {
                let firstDot = entries[i].filename.indexOf(".");
                let extension = "";
                if (firstDot != -1) {
                    extension = entries[i].filename.substring(firstDot + 1);
                }
                this.zipTable.addData([{ name: entries[i].filename, type: extension }]);
            }
        }
        this.zipTable.setSort([
            { column: "name", dir: "asc" }
        ]);

        let rows = this.zipTable.getRows();
        for (let i = 0; i < rows.length; i++) {

            if (rows[i].getPrevRow() == 0) {
                rows[i].select();
                break;
            }
        }
    }

    setUploadErrorCallback(cb) {
        this._uploadErrorCallback = cb;
    }

    async zipFileSelected() {
        let selectedRows = this.zipTable.getSelectedRows();
        if (selectedRows.length == 1) {
            $("#standarduploaddiv").css('display', 'block');
            $("#zipcontentdiv").css('display', 'none');
            $("#dropzonewrapper").css('display', 'block');
            this.startPath = selectedRows[0].getData().name;
            this._zipViewActive = false;
            if (myUserManagmentClient.getUseDirectFetch()) {
                let json = await myUserManagmentClient.getUploadToken(this._zipFile.name, this._zipFile.size);
                this._zipFile.itemid = json.itemid;
                this._zipFile.signedRequest = json.token;
            }
            this._cb();
        }
    }

    async initialize() {
        let _this = this;

        $("#uploadModal").on("hidden.bs.modal", function () {
            if (_this._zipViewActive) {
                _this._dropZone.removeAllFiles(true);
                _this.uploadTable.clearData();
                _this._zipViewActive = false;
            }
        });

        
        if (myUserManagmentClient.getUseDirectFetch()) {
            this.setupDropzoneForDirectFetch();
        }
        else {
            this.setupDropzone();
        }

      
        this.uploadTable = new Tabulator("#uploadtable", {
            layout: "fitColumns",
            responsiveLayout: "hide",
            cellVertAlign: "middle",
            selectable: 1,
            rowClick: function (e, row) {
                var i = 0;

            },
            columns: [
                { title: "ID", field: "id", visible: false, sorter: "number", headerSort: false },
                {
                    title: "Progress", field: "progress", formatter: "progress", maxWidth: 80, formatterParams: {
                        legend: function (val) {
                            if (val > 0) {
                                return "";
                            }
                            else {
                                return "Pending";
                            }
                        }
                    }
                },
                { title: "Filename", field: "name", formatter: "plaintext" },
                { title: "Type", field: "type", formatter: "plaintext", maxWidth: 80 },
            ],
        });

        this.zipTable = new Tabulator("#zipcontentdivtable", {
            layout: "fitColumns",
            responsiveLayout: "hide",
            cellVertAlign: "middle",
            selectable: 1,
            rowClick: function (e, row) {
                var i = 0;

            },
            columns: [
                { title: "Filename", field: "name", formatter: "plaintext", sorter: "string" },
                { title: "Type", field: "type", formatter: "plaintext", maxWidth: 80 },
            ],
        });

        this._checkForNewModels();

        let rowMenu = [
            {
                label: "<i class='fas fa-user'></i> Add to Current Model",
                action: async function (e, row) {
                    let modelid = row.getData().id;
                    await _this.loadModel(modelid, false);
                }
            },

            {
                label: "<i class='fas fa-user'></i> Delete",
                action: async function (e, row) {
                    let modelid = row.getData().id;
                    delete _this._modelHash[modelid];
                    _this.modelTable.deleteRow(modelid);
                    await myUserManagmentClient.deleteModel(modelid);
                }
            },
        ];

        let columns;
        if (md.mobile()) {
            columns = [{ title: "ID", field: "id", visible: false, sorter: "number", headerSort: false },
             { title: "", field: "image", formatter: "image", minWidth: 160, maxWidth: 160, responsive: 0, formatterParams: { width: "155px", height: "145px" } },
            { title: "Name", field: "name", formatter: "plaintext", vertAlign: "middle" },
            { title: "Created", field: "created", formatter: "datetime", responsive: 2, vertAlign: "middle",visible:false },
            {
                title: "Size", visible:false ,field: "size", formatter: "money", responsive: 2, maxWidth: 80, vertAlign: "middle", formatterParams: {
                    decimal: ".",
                    thousand: "",
                    symbol: "MB",
                    symbolAfter: true,
                    precision: false
                }
            }
            ];
        }
        else {
            columns = [{ title: "ID", field: "id", visible: false, sorter: "number", headerSort: false },
            { title: "", field: "image", formatter: "image", minWidth: 60, maxWidth: 60, responsive: 0, formatterParams: { width: "55px", height: "45px" } },
            { title: "Name", field: "name", formatter: "plaintext", vertAlign: "middle" },
            { title: "Created",  field: "created", formatter: "datetime", sorter:"date", responsive: 2, vertAlign: "middle" ,formatterParams:{
                outputFormat:"yyyy-MM-dd HH:mm",
                invalidPlaceholder:"(invalid date)",
                timezone:"America/Los_Angeles",
            }},
            {
                title: "Size", field: "size", formatter: "money", responsive: 2, maxWidth: 80, sorter:"number",vertAlign: "middle", formatterParams: {
                    decimal: ".",
                    thousand: "",
                    symbol: "MB",
                    symbolAfter: true,
                    precision: false
                }
            }
            ];
        }

        this.modelTable = new Tabulator("#sidebar_modellist", {
            initialSort:[
                {column:"created", dir:"asc"}, //sort by this first
            ],
            layout: "fitColumns",
            responsiveLayout: "hide",
            cellVertAlign: "middle",
            selectable: 1,
            rowContextMenu: rowMenu,
            columns: columns,
        });

        this.modelTable.on("rowSelected", function (row) {
            let data = row.getData();
            _this.loadModel(data.id);
        });
     

    }
    
    showUploadWindow() {

        $("#standarduploaddiv").css('display', 'block');
        $("#dropzonewrapper").css('display', 'block');
        $("#zipcontentdiv").css('display', 'none');
        let myModal = new bootstrap.Modal(document.getElementById('uploadModal'));
     
        myModal.toggle();
    }

   


    hideUploadWindow() {
        $("#filedroparea").css("display", "none");
    }

    async _checkForNewModels() {

        if (this._checkForNewModelsPending) {
            return;
        }
        this._checkForNewModelsPending = true;
        let data = await myUserManagmentClient.getModels();
        this._checkForNewModelsPending = false;

        let newtime = Date.parse(data.updated);
        if (this._updatedTime == undefined || this._updatedTime != newtime) {
            await this._updateModelList(data.modelarray);
            this._updatedTime = newtime;
        }
    }

    async _fetchImage(data) {
        let image;
        if (myUserManagmentClient.getUseDirectFetch()) {
            let json = await myUserManagmentClient.getDownloadToken(data.id, "png");
            if (!json.error) {
                image = await fetch(json.token);
            }
        }
        else {
            image = await myUserManagmentClient.getPNG(data.id);
        }

        if (image) {
            let imageblob = await image.blob();
            let urlCreator = window.URL || window.webkitURL;
            let part = urlCreator.createObjectURL(imageblob);
            this._modelHash[data.id].image = part;
            this.modelTable.updateData([{ id: data.id, image: part }]);
        }
    }

    async _updateModelList(data) {
        let _this = this;
        for (let i in this._modelHash) {
            this._modelHash[i].touched = false;
        }
        for (var i = 0; i < data.length; i++) {
            if (data[i].pending) {
                if(!_this._checkInterval) {
                    _this._checkInterval = setInterval(async function () {
                        await _this._checkForNewModels();
                    }, 2000);
                }            
            }

            let part = null;
            if (!data[i].pending && (!this._modelHash[data[i].id] || !this._modelHash[data[i].id].image)) {
                part = this._fetchImage(data[i]);
            }

            if (!this._modelHash[data[i].id]) {
                this._modelHash[data[i].id] = { nodeid: null, name: data[i].name, image: part, filesize: data[i].filesize, uploaded: data[i].uploaded };
                this.modelTable.addData([{
                    id: data[i].id, name: this._modelHash[data[i].id].name, created:luxon.DateTime.fromJSDate(new Date(this._modelHash[data[i].id].uploaded)),
                    image: this._modelHash[data[i].id].image ? this._modelHash[data[i].id].image : "app/images/spinner.gif", size: (this._modelHash[data[i].id].filesize / (1024 * 1024)).toFixed(2)
                }]);
                 
            }
            else {
                if (!this._modelHash[data[i].id].image && part) {
                    this._modelHash[data[i].id].image = part;
                    this.modelTable.updateData([{ id: data[i].id, image: part }]);
                }
            }
            this._modelHash[data[i].id].touched = true;
        }       
        for (let i in this._modelHash) {
            if (!this._modelHash[i].touched && !this._modelHash[i].hasError) {
                this._modelHash[i].hasError = true;
                this.modelTable.updateData([{ id: i, image: "app/images/error.png" }]);
            }
        }

    }

    async loadModel(modelid, clear = true) {

        if (this._firstLoad) {
            this._firstLoad = false;
        }
        else
        {
            if (clear) {
                await hwv.model.clear();                   
            }
            hwv.view.setPointSize(0.003,Communicator.PointSizeUnit.ProportionOfBoundingDiagonal);
            hwv.view.setEyeDomeLightingEnabled(true);
            hwv.view.setPointShape(Communicator.PointShape.Disk)
        }

        if (this._modelHash[modelid].name.indexOf(".dwg") != -1) {
            hwv.view.setAmbientOcclusionEnabled(false);
        }
        let json;
        if (!myUserManagmentClient.getUseStreaming()) {
            if (myUserManagmentClient.getUseDirectFetch()) {
                json = await myUserManagmentClient.getDownloadToken(modelid, "scs");
                await hwv.model.loadSubtreeFromScsFile(hwv.model.getRootNode(), json.token);
            }
            else {
                let byteArray = await myUserManagmentClient.getSCS(modelid);
                await hwv.model.loadSubtreeFromScsFile(hwv.model.getRootNode(), byteArray);
            }
        }
        else {
            await myUserManagmentClient.enableStreamAccess(modelid);
            await hwv.model.loadSubtreeFromModel(hwv.model.getRootNode(), this._modelHash[modelid].name);
        }
        let op = hwv.operatorManager.getOperator(Communicator.OperatorId.Walk);
        op.resetDefaultWalkSpeeds();
    }

    uploadAsAssemblyClicked() {
        if (myUserManagmentClient.getUseDirectFetch()) {
            if ($("#uploadAsAssemblycheck")[0].checked) {
                $("#assemblyuploadbutton").css('display', "block");
                this._dropZone.options.autoProcessQueue = false;
                this._dropZone.options.parallelUploads = 500;
            }
            else {
                $("#assemblyuploadbutton").css('display', "none");
                this._dropZone.options.autoProcessQueue = true;
                this._dropZone.options.parallelUploads = 3;
                this._dropZone.options.paramName = "file";
            }
        }
        else {
            if ($("#uploadAsAssemblycheck")[0].checked) {
                $("#assemblyuploadbutton").css('display', "block");
                this._dropZone.options.autoProcessQueue = false;
                this._dropZone.options.uploadMultiple = true;
                this._dropZone.options.parallelUploads = 500;
                this._dropZone.options.paramName = function() { return "files"};

                this._dropZone.options.url = myUserManagmentClient.getUploadArrayURL();
            }
            else {
                $("#assemblyuploadbutton").css('display', "none");
                this._dropZone.options.autoProcessQueue = true;
                this._dropZone.options.uploadMultiple = false;
                this._dropZone.options.parallelUploads = 3;
                this._dropZone.options.paramName = "file";
                this._dropZone.options.url = myUserManagmentClient.getUploadURL();
            }
        }

    }

    async uploadAsAssemblyStartClicked() {
        if (myUserManagmentClient.getUseDirectFetch()) {
            let files = this._dropZone.getAcceptedFiles();

            var selectedRows = this.uploadTable.getSelectedRows();
            let name;
            if (selectedRows.length != 0) {
                name = selectedRows[0].getData().name;
            }
            else {
                name = this.uploadTable.getRows()[0].getData().name;
            }
            
            let totalsize = 0;
            for (let i = 0; i < files.length; i++) {
                totalsize += files[i].size;             
            }
            this.startPath = name;

            let res = await myUserManagmentClient.createEmptyModel(name,totalsize, name);
            this._assemblyID = res.itemid;
    
           
            for (let i = 0; i < files.length; i++) {
                let json = await myUserManagmentClient.getUploadToken(files[i].name, files[i].size,  this._assemblyID);
                files[i].itemid = json.itemid;
                files[i].signedRequest = json.token;
                this._dropZone.processFile(files[i]);
            }
        }
        else {
            this._dropZone.processQueue();
        }
    }


    async setupDropzone() {
        let _this = this;
        this._dropZone = new Dropzone("div#dropzonearea", {
            headers: { 'CSUM-API-SESSIONID': myUserManagmentClient.getSessionID() },
            url: myUserManagmentClient.getUploadURL(), maxFilesize: 160, maxFiles: 500, parallelUploads: 10, method: 'post', parallelUploads: 3,timeout: 180000, uploadMultiple: false, autoProcessQueue: true,
            addedfile: function (file) {
                let firstDot = file.name.indexOf(".");
                let extension = "";
                if (firstDot != -1) {
                    extension = file.name.substring(firstDot + 1);
                }
                _this.uploadTable.addData([{ id: file.upload.uuid, name: file.name, type: extension, progress: 0 }]);
            },
            uploadprogress: function (file, progress, bytesSent) {
                _this.uploadTable.updateData([{ id: file.upload.uuid, progress: progress }]);
            },
            error(file, message) {
                console.log(message);
                _this._dropZone.removeFile(file);
                _this.uploadTable.deleteRow(file.upload.uuid);
                if (_this._uploadErrorCallback) {
                    _this._uploadErrorCallback(message);
                }
            },
            accept: async function (file, cb) {
     
                if(!_this._checkInterval) {
                    _this._checkInterval = setInterval(async function () {
                        await _this._checkForNewModels();
                    }, 2000);
                }

                if (file.name.indexOf(".zip") != -1) {

                    if (_this._zipViewActive) {
                        _this.uploadTable.deleteRow(file.upload.uuid);
                        _this._dropZone.removeFile(file);
                    }
                    else {
                        await _this.chooseZipContent(file, cb);
                    }
                }
                else {
                    cb();
                }
            },
        });
        this._dropZone.on("success", async function (file, response) {
            _this.uploadTable.deleteRow(file.upload.uuid);
            _this._dropZone.removeFile(file);
        });

        this._dropZone.on("successmultiple", async function (file, response) {
            _this.uploadTable.clearData();
        });

        this._dropZone.on("sending", async function (file, response, request) {
            response.setRequestHeader('startpath', _this.startPath);
        });

        this._dropZone.on("sendingmultiple", async function (file, response, request) {
            var selectedRows = _this.uploadTable.getSelectedRows();
            let name;
            if (selectedRows.length != 0) {
                name = selectedRows[0].getData().name;
            }
            else {
                name = _this.uploadTable.getRows()[0].getData().name;
            }
            response.setRequestHeader('startmodel', name);
        });
    }

    displayInvalidFileTypeMessage(file,message) {
        this._uploadErrorCallback(message);
        this._dropZone.removeFile(file);
        this.uploadTable.deleteRow(file.upload.uuid);
    }

    async setupDropzoneForDirectFetch() {
        let _this = this;
        this._dropZone = new Dropzone("div#dropzonearea", {
            headers: { 'CSUM-API-SESSIONID': myUserManagmentClient.getSessionID() },
            url:  "#", maxFiles: 500, maxFilesize: 160,parallelUploads: 10, method: 'put', timeout: 180000, parallelUploads: 3,uploadMultiple: false, autoProcessQueue: true,
            addedfile: function (file) {
                let firstDot = file.name.indexOf(".");
                let extension = "";
                if (firstDot != -1) {
                    extension = file.name.substring(firstDot + 1);
                }
                _this.uploadTable.addData([{ id: file.upload.uuid, name: file.name, type: extension, progress: 0 }]);
            },
            uploadprogress: function (file, progress, bytesSent) {
                _this.uploadTable.updateData([{ id: file.upload.uuid, progress: progress }]);
            },
            error(file, message) {
                console.log(message);
                _this._dropZone.removeFile(file);
                _this.uploadTable.deleteRow(file.upload.uuid);
                if (_this._uploadErrorCallback) {
                    _this._uploadErrorCallback(message);
                }
            },
            accept: async function (file, cb) {
                     
                if (file.name.endsWith('.skp')) {
                    _this.displayInvalidFileTypeMessage(file, "Sketchup files cannot be converted by this demo currenty as the backend is linux based and Sketchup files require a windows system. To convert your sketchup models please use the HOOPS Communicator windows package directly.");                  
                    return;
                } 
             
                if (file.name.endsWith('.xml') || file.name.endsWith('.txt') || file.name.endsWith('.json') && file.name.endsWith('.doc')) {
                    _this.displayInvalidFileTypeMessage(file, "Text files cannot be converted.");                  
                    return;
                } 

                if (file.name.endsWith('.png') || file.name.endsWith('.jpg')) {
                    _this.displayInvalidFileTypeMessage(file, "Image files cannot be converted.");                  
                    return;
                } 

                if (file.name.endsWith('.7z')) {
                    _this.displayInvalidFileTypeMessage(file, "Only regular zip files are supported for assembly upload.");                  
                    return;
                } 

                if(!this._checkInterval) {
                    this._checkInterval = setInterval(async function () {
                        await _this._checkForNewModels();
                    }, 2000);
                }

                if (file.name.indexOf(".zip") != -1) {

                    if (_this._zipViewActive) {
                        _this.uploadTable.deleteRow(file.upload.uuid);
                        _this._dropZone.removeFile(file);
                    }
                    else {
                        await _this.chooseZipContent(file, cb);
                    }
                }
                else {
                    if (!$("#uploadAsAssemblycheck")[0].checked) {
                        let json = await myUserManagmentClient.getUploadToken(file.name, file.size);

                        file.itemid = json.itemid;
                        file.signedRequest = json.token;
                    }

                    cb();
                }
            },
            sending: function (file, xhr) {

                var _send = xhr.send;
                //            xhr.setRequestHeader('x-amz-acl', 'public-read');
                xhr.send = function () {
                    _send.call(xhr, file);
                };
            },
            processing: function (file) {
                this.options.url = file.signedRequest;
            }
        });
        this._dropZone.on("success", async function (file, response) {
            if (!$("#uploadAsAssemblycheck")[0].checked) {
                myUserManagmentClient.processUploadFromToken(file.itemid, _this.startPath);
            }
            else {
                let files = _this._dropZone.getAcceptedFiles();
                if (files.length == 1) {
                    myUserManagmentClient.processUploadFromToken( _this._assemblyID, _this.startPath);
                }
            }
            _this.uploadTable.deleteRow(file.upload.uuid);
            _this._dropZone.removeFile(file);
        });

        this._dropZone.on("successmultiple", async function (file, response) {
            _this.uploadTable.clearData();
        });

        this._dropZone.on("sending", async function (file, response, request) {

            response.setRequestHeader('startpath', _this.startPath);

        });

        this._dropZone.on("sendingmultiple", async function (file, response, request) {
            var selectedRows = _this.uploadTable.getSelectedRows();
            let name;
            if (selectedRows.length != 0) {
                name = selectedRows[0].getData().name;
            }
            else {
                name = _this.uploadTable.getRows()[0].getData().name;
            }

            response.setRequestHeader('startmodel', name);
        });
    }

}