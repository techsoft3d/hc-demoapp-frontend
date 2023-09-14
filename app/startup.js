const version = "v1.0.5";

let serveraddress;
let serveraddressBackup;
if (window.location.href.indexOf("https://demo.techsoft3d.com") == -1) {
  serveraddress = window.location.protocol + "//" + window.location.host;
}
else {
  serveraddress = "https://caas.techsoft3d.com:443";
  serveraddressBackup = "https://caas2.techsoft3d.com:443";
}

var myAdmin;
var myUserManagmentClient;
var myCsManagerClient;



function getUrlParameter(sParam) {
  var sPageURL = window.location.search.substring(1),
      sURLVariables = sPageURL.split('&'),
      sParameterName,
      i;

  for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');

      if (sParameterName[0] === sParam) {
          if (sParameterName[1] === undefined) {
              return true;
          }
          else {
              let res = decodeURIComponent(sParameterName[1]);
              if (res == 'false') {
                  return false;
              }
              else {
                  return res;
              }
          }
      }
  }
  return false;
}




function switchStreaming() {
  localStorage.setItem("CSDA-DISABLESTREAMING", myAdmin.getStreamingDisabled() ? false : true);
  window.location.reload(true); 
}


function uploadErrorCallback(message) {
  Swal.fire({
    title: 'Upload Error',
    text: message,
    confirmButtonText: 'Dismiss',
    backdrop: false,
    width: '50em'
  })
}


async function setupApp() {

  myCsManagerClient = new CsManagerClient();
  myCsManagerClient.setUploadErrorCallback(uploadErrorCallback);


 // await fetch(serveraddress + '/test', { method: 'PUT' });        
  myUserManagmentClient = new CaasU.CaasUserManagementClient(serveraddress); 
  $.notify.addStyle('notifyerror', {
    html: "<div><span data-notify-text/></div>",
    classes: {
      base: {
        "white-space": "nowrap",
        "background-color": "white",
        'color': 'black',
        'box-shadow': "rgba(0, 0, 0, 0.35) 0px 5px 15px",
        'border-radius': "25px",
        'opacity': "0.75",
        'padding': "15px"
      }
    }
  });

  mainUI = new MainUI();
  mainUI.registerSideBars("sidebar_models", 450);

  myAdmin = new Admin();
  if (!getUrlParameter("serverurl")) {
    myAdmin.setStreamingDisabled(localStorage.getItem("CSDA-DISABLESTREAMING") == 'true' ? true : false);
  }

  myAdmin.setUpdateUICallback(mainUI.updateMenu);
  myAdmin.setLoadProjectCallback(loadProjectCallback);

  await myAdmin.checkLogin();
  mainUI.setupMenu();
}

async function loadProjectCallback() {
  await initializeViewer();
  myCsManagerClient.initialize();
}

function showHelp() {
  let html = "";
  if (md.mobile()) {
    html+='<div style="margin-top:5px;text-align:left;font-size:18px;">';
  }
  else {
    html+='<div style="margin-top:5px;text-align:left;font-size:14px;">';
  }

  html+='Click the <i class="bx bx-file"></i> button to bring up the list of available models. From there you can load models into the webview by clicking on one of the rows. Right-Clicking on a row brings up a menu that allows you to add the model to the existing content of the webviewer (useful for example if you want to load multiple federates BIM models simultaneously) or to delete the model from your account.<br><br>';
  html+='To upload and convert models, click on the <i class="bx bx-upload"></i> button from the model list which will bring up the upload dialog. For single files, simply drag & drop one or more files on the upload area. Those will be immediatly uploaded and converted. ';
  html+='To upload assemblies consisting of more than one file you have two options:<br>';
  html+='<ul><li>Click the "Upload as Assembly" checkbox and then drag & drop all files the assembly consist of into the upload area (you can also click on the upload area to select the files via the filemanager). When all files are staged select the main assembly file before clicking the upload button. Assemblies containing subdirectories are not supported with this method.</li>';
  html+='<li>Create a zip file of your assembly and drag it into the upload area (leave the "Upload as Assembly" checkbox unchecked). Instead of the file immediatly getting uploaded the content of the zip file will be displayed. After selecting the main assembly you can then click the upload button to upload the file.</li></ul><br>';
  html+='Currently your account is ephemeral, meaning it is tied to your browser and any files you uploaded will only be available to you on the same browser if you reload the page. Any accounts that have not been accessed in 24 hours will be purged, including any uploaded files. You can also manually force a purge by selection "Reset Demo Project" from the top-right menu';
  html+=' in which case your account will be reinitialized with the default models.<br><br>';
  html+='The top-right menu allows you to switch from streaming mode (which utilizes the stream cache server for optimal loading performance) to SCS loading, which is a stateless mode that does not require a backend for streaming.<br><br>';
  html+= 'If you have any question feel free to get in touch via email (guido@techsoft3d.com) or post in the <a href ="https://forum.techsoft3d.com" "target="_blank">forum</a>. To get more technical details on how this demo was built go <span style="cursor: pointer;color:blue;" onclick="showBuilt()">here</span>.</a>';
  html+='</div';
  Swal.fire({

    title: 'Help',
    html: html,

    confirmButtonText: 'Dismiss',
    backdrop: false,
    width:'50em',
    showClass: {
        backdrop: 'swal2-noanimation', // disable backdrop animation
        popup: '',                     // disable popup animation
        icon: ''                       // disable icon animation
    },

})
}


function showBuilt() {
  let html = "";
  html+='<div style="margin-top:5px;text-align:left;font-size:14px;">';
  html+='This demo is powered by the <a href ="https://docs.techsoft3d.com/communicator/latest/prog_guide/viewing/overview.html" "target="_blank">HOOPS Communicator Webviewer</a> library on the client and uses its standard UI with an additional layer specific to this demo (built with bootstrap). ';
  html+='The backend is running on Amazon EC2 and utilizing our <a href ="https://docs.techsoft3d.com/communicator/latest/prog_guide/servers/stream_cache_server/overview.html" "target="_blank">Stream Cache Server</a> as well as <a href ="https://docs.techsoft3d.com/communicator/latest/prog_guide/data_import/cad_conversion/converter_app/converter-application-overview.html" "target="_blank">Converter</a> for CAD Conversion.';
  html+= ' All uploaded and converted models are stored in Amazon S3.<br><br>'
  html+= 'The backend as well as the front-end have been built with the <a href ="https://forum.techsoft3d.com/t/conversion-and-streaming-backend-for-hoops-communicator/1314" "target="_blank">Communcator as a Service (CaaS)</a> project as well as its <a href ="https://forum.techsoft3d.com/t/user-management-library-for-caas-released/1535" "target="_blank">User Management</a> component.'
  html+= ' The source code for this demo is available on GitHub <a href ="https://forum.techsoft3d.com/t/conversion-and-streaming-backend-for-hoops-communicator/1314" "target="_blank">here.</a><br><br>';
  html+= 'If you have any question feel free to get in touch via email (guido@techsoft3d.com) or post in the <a href ="https://forum.techsoft3d.com" "target="_blank">forum</a>.';
  html+='</div';
  Swal.fire({

    title: 'Technical Info',
    html: html,

    confirmButtonText: 'Dismiss',
    backdrop: false,
    showClass: {
        backdrop: 'swal2-noanimation', // disable backdrop animation
        popup: '',                     // disable popup animation
        icon: ''                       // disable icon animation
    },

})
}


function showAbout() {
  let html = 'This is a demo of the  <a href="https://www.techsoft3d.com/products/hoops/web-platform" target="_blank">HOOPS Web Platform</a>, a framework for developing advanced web-based engineering applications.<br>';
  html+='<div style="margin-top:5px;text-align:left;font-size:14px;">';
  html+='<ul><li>View and interrogate the provided sample models or upload your own from any of the more than 25 <a href="https://docs.techsoft3d.com/communicator/latest/overview/supported-formats.html "target="_blank">supported formats.</a> For help with this demo go <span style="cursor: pointer;color:blue;" onclick="showHelp()">here</span>.</a></li>'
  html+='<li style="margin-top:4px">To learn more about developing your own application with the HOOPS Web Platform please see the <a href="https://docs.techsoft3d.com/communicator/latest/" target="_blank">documentation</a>, visit our <a href="https://forum.techsoft3d.com/" target="_blank">forum</a> or jump right into coding with our <a href="https://3dsandbox.techsoft3d.com/" target="_blank">3D Code Sandbox</a>.</li>'
  html+='<li style="margin-top:4px">To sign up for a free trial and download the SDK go <a href="https://manage.techsoft3d.com/" target="_blank">here.</a></li>'
  html+='<li style="margin-top:6px">To get more technical details on how this demo was built go <span style="cursor: pointer;color:blue;" onclick="showBuilt()">here</span>.</a></li></ul>'
  html+='</div';
  Swal.fire({
    title: 'Welcome to the HOOPS Web Platform Demo',
    html: html,
    confirmButtonText: 'Dismiss',
    backdrop: false,

})
}
function msready() {

  // $("#content").css("top", "0px");
  setTimeout(function () {
    
    if (md.mobile()) {
        let newheight = $("#content").height() - 80;
        $("#content").css({ "height": newheight + "px" });
    }

    var op = hwv.operatorManager.getOperator(Communicator.OperatorId.Orbit);
    op.setOrbitFallbackMode(Communicator.OrbitFallbackMode.CameraTarget);
    hwv.view.setAmbientOcclusionEnabled(true);
    hwv.view.setAmbientOcclusionRadius(0.02);

    $(window).resize(function () {
      resizeCanvas();
    });

    $(".webviewer-canvas").css("outline", "none");

  }, 10);
}



async function initializeViewer() {
  if (!md.mobile()) {
    let newheight = $("#content").height() - 40;
    $("#content").css({ "height": newheight + "px" });
  }


  let data;
  if (getUrlParameter("serverurl")) {
    data = {serverurl: getUrlParameter("serverurl"), sessionid: getUrlParameter("id"), model: getUrlParameter("model"), port: "443"};
    $(".sidenav").css("display", "none");
  }
  
  hwv = await myUserManagmentClient.initializeWebviewer("content",data);
  
  $(".versionstring").html(version + (myAdmin.streamingDisabled || !myUserManagmentClient.getUseStreaming() ? " (SCS)" : ' (Streaming from ' + myUserManagmentClient.getStreamingServerURL() + ')'));
  let screenConfiguration =
    md.mobile() !== null
      ? Communicator.ScreenConfiguration.Mobile
      : Sample.screenConfiguration;
  let uiConfig = {
    containerId: "viewerContainer",
    screenConfiguration: screenConfiguration,
    showModelBrowser: true,
    showToolbar: true,
  };

  ui = new Communicator.Ui.Desktop.DesktopUi(hwv, uiConfig);


  hwv.setCallbacks({
    sceneReady: function () {
      hwv.view.setBackgroundColor(new Communicator.Color(196, 196, 196), new Communicator.Color(196, 196, 196));

      if (!md.mobile()) {
        const canvas = hwv.getViewElement();

        hwv.focusInput(true);

        canvas.addEventListener("mouseenter", function () {
          hwv.focusInput(true);
        });
      }
    },
    modelStructureReady: msready,
    firstModelLoaded: () => {
      if (md.mobile()) {
        setTimeout(function () {
          let offset = $("#content").offset();
          let width = $(window).width() - offset.left;
          let height = $(window).height() - offset.top;
          $("#toolBar").css("left", (width / 2 - 280) + "px");
          $("#toolBar").css("bottom", "35px");
        }, 100);
      }
    },
  });

  hwv.start();
}

function resizeCanvas() {
  let offset = $("#content").offset();
  let width = $(window).width() - offset.left;
  let height = $(window).height() - offset.top;
  $("#content").css("width", width + "px");
  $("#content").css("height", (height) + "px");
  hwv.resizeCanvas();
  $("#toolBar").css("left", (width / 2 - 250) + "px");
  $("#toolBar").css("top", (height - 50) + "px");
}


