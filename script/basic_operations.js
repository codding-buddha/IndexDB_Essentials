window.db = window.db || {};
(function (exports) {
    'use strict';
    var dbStore;
    exports.open = function (dbName, version, store, indexes, onOpen) {
        if (!dbName || !version || !store) {
            window.console.error("Please specify dbname, version, store: usage open(dbName, version, store)");
            return;
        }
        var openReq = window.indexedDB.open(dbName, version);
        
        openReq.onupgradeneeded = function (e) {
            var db = e.target.result,
                objectStore;
            if (!db.objectStoreNames.contains(store)) {
                objectStore = db.createObjectStore(store, {autoIncrement: true});
                indexes.forEach(function (index) {
                    objectStore.createIndex(index.name, index.name, typeof (index.constraint) === "object" ? index.constraint : {unique : false});
                });
            }
        };
        
        openReq.onsuccess = function (e) {
            dbStore = e.target.result;
            if (typeof (onOpen) === "function") {
                onOpen();
            }
        };
        
        openReq.onerror = function (e) {
            window.console.error("An error occured while opening db : " + dbName + " " + version + " " + store);
            window.console.dir(e);
        };
    };
    
    exports.set = function (store, data, key, onsuccess) {
        var objectStore = dbStore.transaction(store, "readwrite").objectStore(store),
            r = objectStore.add(data, key);
        r.onsuccess = function (e) {
            if (typeof (onsuccess) === "function") {
                onsuccess(e);
            }
        };
    };
    
    exports.get = function (store, key, onsuccess, onerror) {
        try {
            var objectStore = dbStore.transaction(store, "readonly").objectStore(store),
                req = objectStore.get(key);

            req.onsuccess = function (e) {
                onsuccess(e.target.result);
            };

            req.onerror = function (e) {
                onerror(e);
            };
        } catch (e) {
            window.console.error(e);
            if (typeof (onerror) === "function") {
                onerror(e);
            }
        }
    };
    
    exports.getAll = function (store, onread, onerror) {
        try {
            var objectStore = dbStore.transaction(store, "readonly").objectStore(store);
            objectStore.openCursor().onsuccess = function (e) {
                var cursor = e.target.result;
                if (cursor) {
                    onread(cursor.value);
                    cursor.continue();
                }
            };
        } catch (e) {
            window.console.error(e);
            if (typeof (onerror) === "function") {
                onerror(e);
            }
        }
    };
    
    exports.getByProperty = function (store, property, value, onsuccess, onerror) {
        try {
            var objectStore = dbStore.transaction(store, "readonly").objectStore(store),
                request = objectStore.index(property).get(value);
        
            request.onsuccess = function (e) {
                if (typeof (onsuccess) === "function") {
                    onsuccess(e.target.result);
                }
            };

            request.onerror = function (e) {
                window.console.error(property + " index is not created");
            };
        } catch (e) {
            window.console.error(e);
            if (typeof (onerror) === "function") {
                onerror(e);
            }
        }
    };
    
}(window.db));