/**
 * Yandex Games SDK Integration
 * Handles SDK initialization, cloud saves, rewarded video ads, and gameplay API
 */

var gdjs;
(function(gdjs) {
    // Yandex SDK namespace
    gdjs._yandexSDK = {
        ysdk: null,
        player: null,
        isInitialized: false,
        isPlayerInitialized: false,
        cloudData: null,
        lastCloudSaveTime: 0,
        SAVE_DEBOUNCE_MS: 1000, // Debounce cloud saves to avoid rate limiting

        /**
         * Initialize Yandex SDK
         * @returns {Promise} Resolves when SDK is ready
         */
        init: function() {
            var self = this;
            return new Promise(function(resolve, reject) {
                if (typeof YaGames === 'undefined') {
                    console.warn('YaGames SDK not available, running in local mode');
                    resolve(null);
                    return;
                }

                YaGames.init()
                    .then(function(ysdk) {
                        self.ysdk = ysdk;
                        self.isInitialized = true;
                        console.log('Yandex SDK initialized successfully');

                        // Get language from Yandex environment
                        var lang = ysdk.environment.i18n.lang || 'ru';
                        console.log('Yandex language:', lang);

                        resolve(ysdk);
                    })
                    .catch(function(error) {
                        console.error('Yandex SDK init error:', error);
                        reject(error);
                    });
            });
        },

        /**
         * Initialize player for cloud saves
         * @param {boolean} requireAuth - Whether to require authorization
         * @returns {Promise} Resolves with player object
         */
        initPlayer: function(requireAuth) {
            var self = this;
            requireAuth = requireAuth || false;

            return new Promise(function(resolve, reject) {
                if (!self.isInitialized || !self.ysdk) {
                    console.warn('SDK not initialized, cannot init player');
                    resolve(null);
                    return;
                }

                self.ysdk.getPlayer({ scopes: requireAuth })
                    .then(function(player) {
                        self.player = player;
                        self.isPlayerInitialized = true;
                        console.log('Yandex player initialized, authorized:', player.getMode() !== 'lite');
                        resolve(player);
                    })
                    .catch(function(error) {
                        console.error('Yandex player init error:', error);
                        reject(error);
                    });
            });
        },

        /**
         * Load data from Yandex cloud
         * @returns {Promise} Resolves with cloud data object
         */
        loadCloudData: function() {
            var self = this;
            return new Promise(function(resolve, reject) {
                if (!self.isPlayerInitialized || !self.player) {
                    console.warn('Player not initialized, cannot load cloud data');
                    resolve(null);
                    return;
                }

                self.player.getData()
                    .then(function(data) {
                        self.cloudData = data || {};
                        console.log('Cloud data loaded:', Object.keys(self.cloudData).length, 'keys');
                        resolve(self.cloudData);
                    })
                    .catch(function(error) {
                        console.error('Error loading cloud data:', error);
                        self.cloudData = {};
                        resolve(self.cloudData);
                    });
            });
        },

        /**
         * Save data to Yandex cloud
         * @param {Object} data - Data to save
         * @param {boolean} flush - Whether to flush immediately
         * @returns {Promise} Resolves when saved
         */
        saveCloudData: function(data, flush) {
            var self = this;
            flush = flush || false;

            return new Promise(function(resolve, reject) {
                if (!self.isPlayerInitialized || !self.player) {
                    console.warn('Player not initialized, cannot save cloud data');
                    resolve(false);
                    return;
                }

                // Debounce saves
                var now = Date.now();
                if (!flush && (now - self.lastCloudSaveTime) < self.SAVE_DEBOUNCE_MS) {
                    resolve(true);
                    return;
                }
                self.lastCloudSaveTime = now;

                // Merge with existing cloud data
                self.cloudData = Object.assign({}, self.cloudData, data);

                self.player.setData(self.cloudData, flush)
                    .then(function() {
                        console.log('Cloud data saved:', Object.keys(data).length, 'keys updated');
                        resolve(true);
                    })
                    .catch(function(error) {
                        console.error('Error saving cloud data:', error);
                        resolve(false);
                    });
            });
        },

        /**
         * Get a specific value from cloud data
         * @param {string} key - Key to get
         * @param {*} defaultValue - Default value if not found
         * @returns {*} Value or default
         */
        getCloudValue: function(key, defaultValue) {
            if (this.cloudData && typeof this.cloudData[key] !== 'undefined') {
                return this.cloudData[key];
            }
            return defaultValue;
        },

        /**
         * Set a specific value in cloud data
         * @param {string} key - Key to set
         * @param {*} value - Value to set
         */
        setCloudValue: function(key, value) {
            if (!this.cloudData) {
                this.cloudData = {};
            }
            this.cloudData[key] = value;
        },

        /**
         * Show rewarded video ad
         * @param {Object} callbacks - Callback functions
         * @returns {Promise} Resolves with reward status
         */
        showRewardedVideo: function(callbacks) {
            var self = this;
            callbacks = callbacks || {};

            return new Promise(function(resolve, reject) {
                if (!self.isInitialized || !self.ysdk) {
                    console.warn('SDK not initialized, cannot show rewarded video');
                    if (callbacks.onError) callbacks.onError(new Error('SDK not initialized'));
                    resolve(false);
                    return;
                }

                self.ysdk.adv.showRewardedVideo({
                    callbacks: {
                        onOpen: function() {
                            console.log('Yandex rewarded video opened');
                            if (callbacks.onOpen) callbacks.onOpen();
                        },
                        onRewarded: function() {
                            console.log('Yandex rewarded video - reward granted');
                            if (callbacks.onRewarded) callbacks.onRewarded();
                        },
                        onClose: function() {
                            console.log('Yandex rewarded video closed');
                            if (callbacks.onClose) callbacks.onClose();
                            resolve(true);
                        },
                        onError: function(error) {
                            console.error('Yandex rewarded video error:', error);
                            if (callbacks.onError) callbacks.onError(error);
                            resolve(false);
                        }
                    }
                });
            });
        },

        /**
         * Call LoadingAPI.ready() to signal the game is loaded
         */
        signalLoadingReady: function() {
            if (this.isInitialized && this.ysdk && this.ysdk.features && this.ysdk.features.LoadingAPI) {
                this.ysdk.features.LoadingAPI.ready();
                console.log('Yandex LoadingAPI.ready() called');
            }
        },

        /**
         * Call GameplayAPI.start() to signal gameplay started
         */
        gameplayStart: function() {
            if (this.isInitialized && this.ysdk && this.ysdk.features && this.ysdk.features.GameplayAPI) {
                this.ysdk.features.GameplayAPI.start();
                console.log('Yandex GameplayAPI.start() called');
            }
        },

        /**
         * Call GameplayAPI.stop() to signal gameplay stopped
         */
        gameplayStop: function() {
            if (this.isInitialized && this.ysdk && this.ysdk.features && this.ysdk.features.GameplayAPI) {
                this.ysdk.features.GameplayAPI.stop();
                console.log('Yandex GameplayAPI.stop() called');
            }
        },

        /**
         * Get language from Yandex environment
         * @returns {string} Language code (defaults to 'ru')
         */
        getLanguage: function() {
            if (this.isInitialized && this.ysdk && this.ysdk.environment && this.ysdk.environment.i18n) {
                return this.ysdk.environment.i18n.lang || 'ru';
            }
            return 'ru';
        },

        /**
         * Initialize after game load - blocks UI, initializes SDK, player, cloud data
         * @returns {Promise}
         */
        initializeAfterLoad: function() {
            var self = this;
            var overlay = document.getElementById('yandex-loading-overlay');

            return new Promise(function(resolve, reject) {
                // Show overlay to block UI
                if (overlay) overlay.classList.remove('hidden');

                // Initialize SDK
                self.init()
                    .then(function(ysdk) {
                        if (!ysdk) {
                            // Running locally without SDK
                            if (overlay) overlay.classList.add('hidden');
                            resolve();
                            return;
                        }

                        // Initialize player
                        return self.initPlayer(false);
                    })
                    .then(function(player) {
                        if (!player) {
                            // Player init failed or no SDK
                            self.signalLoadingReady();
                            self.gameplayStart();
                            if (overlay) overlay.classList.add('hidden');
                            resolve();
                            return;
                        }

                        // Load cloud data
                        return self.loadCloudData();
                    })
                    .then(function(cloudData) {
                        // Signal loading ready
                        self.signalLoadingReady();

                        // Start gameplay
                        self.gameplayStart();

                        // Get and set language (force Russian as per existing code)
                        var lang = self.getLanguage();
                        console.log('Yandex SDK language:', lang);

                        // Hide overlay to allow user interaction
                        if (overlay) overlay.classList.add('hidden');

                        console.log('Yandex SDK fully initialized');
                        resolve();
                    })
                    .catch(function(error) {
                        console.error('Yandex SDK initialization error:', error);
                        // Hide overlay even on error
                        if (overlay) overlay.classList.add('hidden');
                        resolve(); // Don't reject, game should still run
                    });
            });
        }
    };

    // Helper functions for GDevelop integration
    gdjs._yandexSDK.helpers = {
        /**
         * Sync all localStorage data to cloud
         */
        syncLocalStorageToCloud: function() {
            var data = {};
            var prefix = 'GDJS_';

            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    try {
                        var value = localStorage.getItem(key);
                        data[key] = value;
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
         * Sync cloud data to localStorage
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
            console.log('Cloud data synced to localStorage');
        }
    };

    /**
     * GDevelop-compatible rewarded video function
     * Replaces PokiSDK.rewardedBreak() calls
     * Sets AD_Poki variable: 1 = rewarded, 2 = not rewarded
     */
    gdjs._yandexSDK.showRewardedVideoForGDevelop = function(runtimeScene, onStartCallback) {
        var self = this;

        // Call start callback if provided (for compatibility with PokiSDK)
        if (typeof onStartCallback === 'function') {
            onStartCallback();
        }

        // If SDK not available, simulate failure
        if (!self.isInitialized || !self.ysdk) {
            console.warn('Yandex SDK not initialized, cannot show rewarded video');
            runtimeScene.getVariables().get("AD_Poki").setNumber(2);
            return Promise.resolve(false);
        }

        return new Promise(function(resolve) {
            var wasRewarded = false;

            self.ysdk.adv.showRewardedVideo({
                callbacks: {
                    onOpen: function() {
                        console.log('Yandex rewarded video opened');
                    },
                    onRewarded: function() {
                        console.log('Yandex rewarded video - reward granted');
                        wasRewarded = true;
                    },
                    onClose: function() {
                        console.log('Yandex rewarded video closed');
                        if (wasRewarded) {
                            runtimeScene.getVariables().get("AD_Poki").setNumber(1);
                            console.log('AD_Poki reward status: 1 (rewarded)');
                        } else {
                            runtimeScene.getVariables().get("AD_Poki").setNumber(2);
                            console.log('AD_Poki reward status: 2 (not rewarded)');
                        }
                        resolve(wasRewarded);
                    },
                    onError: function(error) {
                        console.error('Yandex rewarded video error:', error);
                        runtimeScene.getVariables().get("AD_Poki").setNumber(2);
                        console.log('AD_Poki reward status: 2 (error)');
                        resolve(false);
                    }
                }
            });
        });
    };

})(gdjs || (gdjs = {}));
