document.addEventListener("deviceready", onDeviceReady, false);
document.addEventListener("unload", persistTasks, false);

function onDeviceReady() {
    gaPlugin = window.plugins.gaPlugin;
    gaPlugin.init(successHandler, errorHandler, "UA-37626236-3", 10);
}

function persistTasks() {
    gaPlugin.exit(nativePluginResultHandler, nativePluginErrorHandler);
}