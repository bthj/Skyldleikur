document.addEventListener("deviceready", onDeviceReady, false);
document.addEventListener("unload", persistTasks, false);

function onDeviceReady() {
    gaPlugin = window.plugins.gaPlugin;
    gaPlugin.init(successHandler, errorHandler, "UA-37626236-3", 10);
    alert(gaPlugin);
}

function persistTasks() {
    gaPlugin.exit(nativePluginResultHandler, nativePluginErrorHandler);
}