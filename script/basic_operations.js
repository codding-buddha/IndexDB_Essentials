window.db = window.db || {};
(function (exports) {
    'use strict';
    var dbStore;
    exports.open = function (dbName, version, store, keyPath, indexes, onOpen) {
        if (!dbName || !version || !store) {
            window.console.error("Please specify dbname, version, store: usage open(dbName, version, store)");
            return;
        }
        var openReq = window.indexedDB.open(dbName, version);
        
        openReq.onupgradeneeded = function (e) {
            var db = e.target.result,
                objectStore;
            if (!db.objectStoreNames.contains(store)) {
                objectStore = db.createObjectStore(store, {keyPath: keyPath, autoIncrement: true});
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
        if (typeof (onsuccess) !== "function") {
            return;
        }
        
        var objectStore = dbStore.transaction(store, "readwrite").objectStore(store),
            r = objectStore.add(data);
        
        r.onsuccess = function (e) {
            onsuccess(e);
        };
    };
    
    exports.get = function (store, key, onsuccess, onerror) {
        try {
            if (typeof (onsuccess) !== "function") {
                return;
            }
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
            if (typeof (onread) !== "function") {
                return;
            }
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
    
    exports.put = function(store, key, update, onupdate, onerror) {
        if(!store || !key || !update)
            return;
        try {
            var objectStore = dbStore.transaction(store, "readwrite").objectStore(store);
            var req = objectStore.get(key);
            req.onsuccess = function (event) {
                var obj = event.target.result,
                    reqUpdate;
                update(obj);
                reqUpdate = objectStore.put(obj);
                reqUpdate.onsuccess = function(e) {
                    onupdate();
                };
            };
        } catch(e) {
            window.console.error(e);
            if (typeof (onerror) === "function") {
                onerror(e);
            }
        }
    };
    
    exports.getByProperty = function (store, property, value, onsuccess, onerror) {
        if (typeof (onsuccess) !== "function") {
            return;
        }
        try {
            var objectStore = dbStore.transaction(store, "readonly").objectStore(store),
                request = objectStore.index(property).get(value);
        
            request.onsuccess = function (e) {
                onsuccess(e.target.result);
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
    
    exports.delete = function (store, key, ondelete, onerror) {
        try {
            var req = dbStore.transaction(store, "readwrite").objectStore(store).delete(key);
            
            req.onsuccess = function (e) {
                ondelete(e.target.result);
            };
            
            req.onerror = function (e) {
                onerror(e);
            };
        } catch (e) {
            window.console.error(e);
            if(typeof (onerror) === "function") {
                onerror(e);
            }
        }
    };
    
}(window.db));