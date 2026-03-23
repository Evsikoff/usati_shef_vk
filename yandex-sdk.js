/**
 * VK Bridge SDK Integration
 * Handles SDK initialization, cloud saves (VK Storage), and rewarded/interstitial ads.
 * Keeps the same gdjs._yandexSDK API surface so game code (codeN.js) stays unchanged.
 */

var gdjs;
(function(gdjs) {
    gdjs._yandexSDK = {
        isInitialized: false,
        isPlayerInitialized: false, // kept for storagetools.js compatibility
        cloudData: null,
        lastCloudSaveTime: 0,
        SAVE_DEBOUNCE_MS: 1000,
        _pendingSaveData: null,
        _saveTimerId: null,
        isOdnoklassniki: false,

        /**
         * Initialize VK Bridge
         * @returns {Promise}
         */
        init: function() {
            var self = this;

            // Detect platform from URL params
            var urlParams = new URLSearchParams(window.location.search);
            self.isOdnoklassniki = (urlParams.get('vk_client') === 'ok');

            return new Promise(function(resolve) {
                if (typeof vkBridge === 'undefined') {
                    console.warn('VK Bridge not available, running in local mode');
                    resolve(null);
                    return;
                }

                vkBridge.send('VKWebAppInit')
                    .then(function(data) {
                        if (data.result) {
                            self.isInitialized = true;
                            console.log('VK Bridge initialized. Odnoklassniki:', self.isOdnoklassniki);
                        }
                        resolve(data.result || null);
                    })
                    .catch(function(error) {
                        console.error('VK Bridge init error:', error);
                        resolve(null);
                    });
            });
        },

        /**
         * No direct VK equivalent for "player" — marks isPlayerInitialized for storagetools.js compatibility
         * @returns {Promise}
         */
        initPlayer: function() {
            this.isPlayerInitialized = this.isInitialized;
            return Promise.resolve(this.isInitialized ? true : null);
        },

        /**
         * Load all saved game keys from VK Storage into cloudData cache.
         * Uses a special index key (GDJS_keys_index) to know which keys to fetch.
         * @returns {Promise}
         */
        loadCloudData: function() {
            var self = this;
            self.cloudData = {};

            return new Promise(function(resolve) {
                if (!self.isInitialized) {
                    resolve(null);
                    return;
                }

                // Step 1: fetch the keys index
                vkBridge.send('VKWebAppStorageGet', { keys: ['GDJS_keys_index'] })
                    .then(function(data) {
                        var indexEntry = data.keys && data.keys.find(function(k) {
                            return k.key === 'GDJS_keys_index';
                        });
                        var keys = [];
                        if (indexEntry && indexEntry.value) {
                            try { keys = JSON.parse(indexEntry.value); } catch (e) {}
                        }

                        if (keys.length === 0) {
                            console.log('VK Storage: no saved keys found');
                            resolve({});
                            return Promise.resolve(null);
                        }

                        // Step 2: fetch all game data keys
                        return vkBridge.send('VKWebAppStorageGet', { keys: keys });
                    })
                    .then(function(data) {
                        if (!data) return;
                        if (data.keys) {
                            data.keys.forEach(function(entry) {
                                if (entry.value !== undefined && entry.value !== '') {
                                    self.cloudData[entry.key] = entry.value;
                                }
                            });
                        }
                        console.log('VK Storage loaded:', Object.keys(self.cloudData).length, 'keys');
                        resolve(self.cloudData);
                    })
                    .catch(function(error) {
                        console.error('Error loading VK Storage:', error);
                        resolve({});
                    });
            });
        },

        /**
         * Save data to VK Storage (key-value, string values only).
         * Maintains a GDJS_keys_index entry to track all stored keys.
         * @param {Object} data - Map of key → JSON-string values
         * @param {boolean} flush - Skip debounce and save immediately
         * @returns {Promise}
         */
        saveCloudData: function(data, flush) {
            var self = this;
            flush = flush || false;

            // Always merge new data into cache immediately
            self.cloudData = Object.assign({}, self.cloudData, data);

            // Accumulate pending data for the next actual VK Storage write
            self._pendingSaveData = Object.assign({}, self._pendingSaveData || {}, data);

            return new Promise(function(resolve) {
                if (!self.isInitialized) {
                    resolve(false);
                    return;
                }

                if (!flush) {
                    // Schedule a debounced flush if not already scheduled
                    if (!self._saveTimerId) {
                        self._saveTimerId = setTimeout(function() {
                            self._saveTimerId = null;
                            self._flushPendingData();
                        }, self.SAVE_DEBOUNCE_MS);
                    }
                    resolve(true);
                    return;
                }

                // Flush immediately
                self._flushPendingData().then(function() {
                    resolve(true);
                }).catch(function() {
                    resolve(false);
                });
            });
        },

        /**
         * Actually send all accumulated pending data to VK Storage
         * @returns {Promise}
         */
        _flushPendingData: function() {
            var self = this;
            var dataToSave = self._pendingSaveData;
            self._pendingSaveData = null;

            if (!dataToSave || Object.keys(dataToSave).length === 0) {
                return Promise.resolve(true);
            }

            // Save each key to VK Storage
            var savePromises = Object.keys(dataToSave).map(function(key) {
                return vkBridge.send('VKWebAppStorageSet', {
                    key: key,
                    value: String(dataToSave[key])
                }).catch(function(e) {
                    console.error('VK Storage set error for key "' + key + '":', e);
                });
            });

            // Update the keys index
            var allKeys = Object.keys(self.cloudData).filter(function(k) {
                return k !== 'GDJS_keys_index';
            });
            savePromises.push(
                vkBridge.send('VKWebAppStorageSet', {
                    key: 'GDJS_keys_index',
                    value: JSON.stringify(allKeys)
                }).catch(function(e) {
                    console.error('VK Storage: failed to update keys index:', e);
                })
            );

            return Promise.all(savePromises)
                .then(function() {
                    console.log('VK Storage saved:', Object.keys(dataToSave).length, 'keys');
                    return true;
                })
                .catch(function() { return false; });
        },

        /**
         * Get a value from the in-memory cloudData cache
         */
        getCloudValue: function(key, defaultValue) {
            if (this.cloudData && typeof this.cloudData[key] !== 'undefined') {
                return this.cloudData[key];
            }
            return defaultValue;
        },

        /**
         * Set a value in the in-memory cloudData cache
         */
        setCloudValue: function(key, value) {
            if (!this.cloudData) this.cloudData = {};
            this.cloudData[key] = value;
        },

        /**
         * Show rewarded video ad via VK Bridge
         * @param {Object} callbacks - onOpen, onRewarded, onClose, onError
         * @returns {Promise<boolean>}
         */
        showRewardedVideo: function(callbacks) {
            var self = this;
            callbacks = callbacks || {};

            return new Promise(function(resolve) {
                if (!self.isInitialized) {
                    console.warn('VK Bridge not initialized, cannot show rewarded ad');
                    if (callbacks.onError) callbacks.onError(new Error('VK Bridge not initialized'));
                    resolve(false);
                    return;
                }

                if (callbacks.onOpen) callbacks.onOpen();

                vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' })
                    .then(function(data) {
                        if (data.result) {
                            if (callbacks.onRewarded) callbacks.onRewarded();
                            if (callbacks.onClose) callbacks.onClose();
                            resolve(true);
                        } else {
                            if (callbacks.onClose) callbacks.onClose();
                            resolve(false);
                        }
                    })
                    .catch(function(error) {
                        console.error('VK rewarded ad error:', error);
                        if (callbacks.onError) callbacks.onError(error);
                        resolve(false);
                    });
            });
        },

        /**
         * Show interstitial ad via VK Bridge
         * @returns {Promise<boolean>}
         */
        showInterstitialAd: function() {
            return Promise.resolve(false);
        },

        // No VK Bridge equivalents — kept as no-ops for compatibility
        signalLoadingReady: function() {},
        gameplayStart: function() {},
        gameplayStop: function() {},

        /**
         * Language — VK apps are Russian-primary, default to 'ru'
         */
        getLanguage: function() {
            return 'ru';
        },

        /**
         * Full initialization sequence called after game assets load.
         * Blocks UI via overlay while loading cloud saves.
         * @returns {Promise}
         */
        initializeAfterLoad: function() {
            var self = this;
            var overlay = document.getElementById('yandex-loading-overlay');

            return new Promise(function(resolve) {
                if (overlay) overlay.classList.remove('hidden');

                self.init()
                    .then(function() {
                        return self.initPlayer();
                    })
                    .then(function() {
                        return self.loadCloudData();
                    })
                    .then(function(cloudData) {
                        if (cloudData && Object.keys(cloudData).length > 0) {
                            // Cloud data found — sync it to localStorage (cloud takes priority)
                            self.helpers.syncCloudToLocalStorage();
                        } else if (self.isInitialized) {
                            // First launch on VK — push any existing localStorage saves to cloud
                            self.helpers.syncLocalStorageToCloud();
                        }

                        if (overlay) overlay.classList.add('hidden');
                        console.log('VK Bridge fully initialized');
                        resolve();
                    })
                    .catch(function(error) {
                        console.error('VK Bridge initialization error:', error);
                        if (overlay) overlay.classList.add('hidden');
                        resolve();
                    });
            });
        }
    };

    // Helper utilities for localStorage ↔ VK Storage sync
    gdjs._yandexSDK.helpers = {
        /**
         * Push all GDJS_ localStorage entries to VK Storage
         */
        syncLocalStorageToCloud: function() {
            var data = {};
            var prefix = 'GDJS_';

            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    try {
                        data[key] = localStorage.getItem(key);
                    } catch (e) {
                        console.warn('Error reading localStorage key:', key, e);
                    }
                }
            }

            if (Object.keys(data).length > 0) {
                return gdjs._yandexSDK.saveCloudData(data, true);
            }
            return Promise.resolve(true);
        },

        /**
         * Write VK Storage cache (cloudData) into localStorage
         */
        syncCloudToLocalStorage: function() {
            var cloudData = gdjs._yandexSDK.cloudData;
            if (!cloudData) return;

            var prefix = 'GDJS_';
            for (var key in cloudData) {
                if (cloudData.hasOwnProperty(key) && key.startsWith(prefix)) {
                    try {
                        localStorage.setItem(key, cloudData[key]);
                    } catch (e) {
                        console.warn('Error writing to localStorage:', key, e);
                    }
                }
            }
            console.log('VK cloud data synced to localStorage');
        }
    };

    /**
     * GDevelop-compatible rewarded video function.
     * Called from game event code via: gdjs._yandexSDK.showRewardedVideoForGDevelop(runtimeScene, cb)
     * Sets AD_Poki scene variable: 1 = rewarded, 2 = not rewarded / error
     */
    gdjs._yandexSDK.showRewardedVideoForGDevelop = function(runtimeScene, onStartCallback) {
        var self = this;

        if (typeof onStartCallback === 'function') onStartCallback();

        if (!self.isInitialized) {
            console.warn('VK Bridge not initialized, cannot show rewarded ad');
            runtimeScene.getVariables().get('AD_Poki').setNumber(2);
            return Promise.resolve(false);
        }

        return vkBridge.send('VKWebAppShowNativeAds', { ad_format: 'reward' })
            .then(function(data) {
                if (data.result) {
                    runtimeScene.getVariables().get('AD_Poki').setNumber(1);
                    console.log('AD_Poki: 1 (rewarded)');
                    return true;
                } else {
                    runtimeScene.getVariables().get('AD_Poki').setNumber(2);
                    console.log('AD_Poki: 2 (not rewarded)');
                    return false;
                }
            })
            .catch(function(error) {
                console.error('VK rewarded ad error:', error);
                runtimeScene.getVariables().get('AD_Poki').setNumber(2);
                return false;
            });
    };

})(gdjs || (gdjs = {}));
