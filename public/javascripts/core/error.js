/* Get System Information to create Error Report */

const info = window.navigator; // USE JavaScript Window Navigator

document.getElementById('userAgent').value = info.userAgent;
document.getElementById('vendor').value = info.vendor;
document.getElementById('language').value = info.language;