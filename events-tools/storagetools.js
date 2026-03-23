var gdjs;
(function(S) {
    const f = new S.Logger("Storage");
    let d;
    (function(p) {
        let h;
        (function(a) {
            let c = null;
            try {
                typeof cc != "undefined" ? c = cc.sys.localStorage : typeof window != "undefined" && (c = window.localStorage)
            } catch (t) {
                f.error("Unable to get access to the localStorage: " + t)
            }
            c || f.error("Storage actions won't work as no localStorage was found.");
            const u = new Hashtable;

/**
             * Save data to both localStorage and VK Storage
             */
            const saveToCloudAndLocal = function(key, data) {
                const jsonString = JSON.stringify(data);

                // Save to localStorage
                try {
                    if (c) c.setItem("GDJS_" + key, jsonString);
                } catch (e) {
                    f.error('Unable to save to localStorage for "' + key + '": ' + e);
                }

                // Save to VK Storage
                if (typeof S._yandexSDK !== 'undefined' && S._yandexSDK.isPlayerInitialized) {
                    const cloudData = {};
                    cloudData["GDJS_" + key] = jsonString;
                    S._yandexSDK.saveCloudData(cloudData, false).catch(function(e) {
                        f.error('Unable to save to VK Storage for "' + key + '": ' + e);
                    });
                }
            };

            a.loadJSONFileFromStorage = t => {
                if (u.containsKey(t)) return;

                // When VK Bridge is initialized, use cloud data as the single source of truth
                if (typeof S._yandexSDK !== 'undefined' && S._yandexSDK.isInitialized && S._yandexSDK.cloudData) {
                    const cloudValue = S._yandexSDK.cloudData["GDJS_" + t];
                    if (cloudValue !== undefined && cloudValue !== null) {
                        try {
                            u.put(t, JSON.parse(cloudValue));
                            f.log('Loaded "' + t + '" from VK Storage cache');
                        } catch (e) {
                            f.log('Cloud data for "' + t + '" is not valid JSON, using empty');
                            u.put(t, {});
                        }
                    } else {
                        // Key not in cloud — use empty object, do NOT fall back to localStorage
                        u.put(t, {});
                    }
                    return;
                }

                // Fallback to localStorage only when VK Bridge is NOT available
                let i = null;
                try {
                    c && (i = c.getItem("GDJS_" + t))
                } catch (l) {
                    f.error('Unable to load data from localStorage for "' + t + '": ' + l)
                }
                let o = {};
                try {
                    i && (o = JSON.parse(i))
                } catch (l) {
                    f.error('Unable to load data from "' + t + '" - data is not valid JSON: ' + l)
                }
                u.put(t, o);
            };

            a.unloadJSONFile = t => {
                if (!u.containsKey(t)) return;
                const i = u.get(t),
                    o = JSON.stringify(i);

                // Save to both localStorage and VK Storage
                saveToCloudAndLocal(t, i);

                u.remove(t)
            };

            const g = (t, i) => {
                let o = !1;
                u.containsKey(t) || (o = !0, a.loadJSONFileFromStorage(t));
                const l = i(u.get(t));
                return o && a.unloadJSONFile(t), l
            };

            a.clearJSONFile = t => g(t, i => {
                for (const o in i) i.hasOwnProperty(o) && delete i[o];
                return !0
            });

            a.elementExistsInJSONFile = (t, i) => g(t, o => {
                const l = i.split("/");
                let n = o;
                for (let e = 0; e < l.length; ++e) {
                    if (!n[l[e]]) return !1;
                    n = n[l[e]]
                }
                return !0
            });

            a.deleteElementFromJSONFile = (t, i) => g(t, o => {
                const l = i.split("/");
                let n = o;
                for (let e = 0; e < l.length; ++e) {
                    if (!n[l[e]]) return !1;
                    e === l.length - 1 ? delete n[l[e]] : n = n[l[e]]
                }
                return !0
            });

            a.writeNumberInJSONFile = (t, i, o) => g(t, l => {
                const n = i.split("/");
                let e = l;
                for (let r = 0; r < n.length; ++r) e[n[r]] || (e[n[r]] = {}), r === n.length - 1 ? e[n[r]].value = o : e = e[n[r]];
                return !0
            });

            a.writeStringInJSONFile = (t, i, o) => g(t, l => {
                const n = i.split("/");
                let e = l;
                for (let r = 0; r < n.length; ++r) e[n[r]] || (e[n[r]] = {}), r === n.length - 1 ? e[n[r]].str = o : e = e[n[r]];
                return !0
            });

            a.readNumberFromJSONFile = (t, i, o, l) => g(t, n => {
                const e = i.split("/");
                let r = n;
                for (let s = 0; s < e.length; ++s) {
                    if (!r[e[s]]) return !1;
                    s === e.length - 1 && typeof r[e[s]].value != "undefined" ? l.setNumber(r[e[s]].value) : r = r[e[s]]
                }
                return !0
            });

            a.readStringFromJSONFile = (t, i, o, l) => g(t, n => {
                const e = i.split("/");
                let r = n;
                for (let s = 0; s < e.length; ++s) {
                    if (!r[e[s]]) return !1;
                    s === e.length - 1 && typeof r[e[s]].str != "undefined" ? l.setString(r[e[s]].str) : r = r[e[s]]
                }
                return !0
            })
        })(h = p.storage || (p.storage = {}))
    })(d = S.evtTools || (S.evtTools = {}))
})(gdjs || (gdjs = {}));
//# sourceMappingURL=storagetools.js.map
