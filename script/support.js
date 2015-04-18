(function (exports) {
    'use strict';
    exports.isIndexDBSupported = false;
    document.addEventListener('DOMContentLoaded', function () {
        if (window.indexedDB !== undefined) {
            exports.isIndexDBSupported = true;
        }
    });
}(window));