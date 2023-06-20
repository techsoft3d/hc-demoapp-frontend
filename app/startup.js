//const serveraddress = "http://127.0.0.1:3000";
//const serveraddress = "http://" + window.location.host;
const serveraddress = "https://caas.techsoft3d.com:443";

var myAdmin;
var myUserManagmentClient;


function switchStreaming() {
  localStorage.setItem("CSDA-DISABLESTREAMING", myAdmin.getStreamingDisabled() ? false : true);
  window.location.reload(true); 
}

async function setupApp() {

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
  myAdmin.setStreamingDisabled(localStorage.getItem("CSDA-DISABLESTREAMING") == 'true' ? true : false);

  myAdmin.setUpdateUICallback(mainUI.updateMenu);
  myAdmin.adminProject.setLoadProjectCallback(loadProjectCallback);

  await myAdmin.checkLogin();
  mainUI.setupMenu();
}

async function loadProjectCallback() {
  await initializeViewer();
  CsManagerClient.msready();
}




function showBuilt() {
  let html = "";
  html+='<div style="margin-top:5px;text-align:left;font-size:14px;">';
  html+='This demo is powered by the <a href ="https://docs.techsoft3d.com/communicator/latest/prog_guide/viewing/overview.html" "target="_blank">HOOPS Communicator Webviewer</a> library on the client and uses its standard UI with an additional layer specific to this demo (built on bootstrap). ';
  html+='The backend is running on Amazon EC2 and utilizing our <a href ="https://docs.techsoft3d.com/communicator/latest/prog_guide/servers/stream_cache_server/overview.html" "target="_blank">Stream Cache Server</a> as well as our <a href ="https://docs.techsoft3d.com/communicator/latest/prog_guide/data_import/cad_conversion/converter_app/converter-application-overview.html" "target="_blank">Converter Application</a> for CAD Conversion.';
  html+= ' All uploaded and converted models are stored in Amazon S3.<br><br>'
  html+= 'The backend as well as the front-end have been built with the <a href ="https://forum.techsoft3d.com/t/conversion-and-streaming-backend-for-hoops-communicator/1314" "target="_blank">Communcator as a Service (CaaS)</a> project as well as its <a href ="https://forum.techsoft3d.com/t/user-management-library-for-caas-released/1535" "target="_blank">User Management</a> component.'
  html+= ' The demo itself will be available on GitHub shortly.<br><br>';
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
  html+='<ul><li>View and interrogate the provided sample models or upload your own from any of the more than 25 <a href="https://docs.techsoft3d.com/communicator/latest/overview/supported-formats.html "target="_blank">supported formats.</a></li>'
  html+='<li style="margin-top:4px">To learn more about developing your own application with the HOOPS Web Platform please see the <a href="https://docs.techsoft3d.com/communicator/latest/" target="_blank">documentation</a>, visit our <a href="https://forum.techsoft3d.com/" target="_blank">forum</a> or jump right into coding with our <a href="https://3dsandbox.techsoft3d.com/" target="_blank">3D Code Sandbox</a>.</li>'
  html+='<li style="margin-top:4px">To sign up for a trial and download the SDK go <a href="https://manage.techsoft3d.com/" target="_blank">here.</a></li>'
  html+='<li style="margin-top:6px">To get more technical details on how this demo was built go <span style="cursor: pointer;color:blue;" onclick="showBuilt()">here</span>.</a></li></ul>'
  html+='</div';
  Swal.fire({

    title: 'Welcome to the HOOPS Web Platform Demo',
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
function msready() {

  // $("#content").css("top", "0px");
  setTimeout(function () {

    var newheight = $("#content").height() - 40;
    $("#content").css("top", "40px");
    $("#content").css({ "height": newheight + "px" });

    var op = hwv.operatorManager.getOperator(Communicator.OperatorId.Orbit);
    op.setOrbitFallbackMode(Communicator.OrbitFallbackMode.CameraTarget);

    hwv.view.setAmbientOcclusionEnabled(true);


    $(window).resize(function () {
      resizeCanvas();
    });

    $(".webviewer-canvas").css("outline", "none");

  }, 10);
}



async function initializeViewer() {
  
  hwv = await myUserManagmentClient.initializeWebviewer("content");
  
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
    sceneReady: () => {
      hwv.view.setBackgroundColor(new Communicator.Color(196,196,196),new Communicator.Color(196,196,196));
    },
    modelStructureReady: msready,
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