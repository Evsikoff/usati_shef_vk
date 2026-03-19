if (typeof gdjs.evtsExt__PokiGamesSDKHtml__LoadSDK !== "undefined") {
    gdjs.evtsExt__PokiGamesSDKHtml__LoadSDK.registeredGdjsCallbacks.forEach(callback =>
        gdjs._unregisterCallback(callback)
    );
}

gdjs.evtsExt__PokiGamesSDKHtml__LoadSDK = {};


gdjs.evtsExt__PokiGamesSDKHtml__LoadSDK.userFunc0x769b268 = function GDJSInlineCode(runtimeScene, eventsFunctionContext) {
    "use strict";
    const logger = new gdjs.Logger("VK Bridge SDK");

    // VK Bridge is loaded via script tag in index.html and initialized in initializeAfterLoad().
    // Mark SDK as ready if VK Bridge is already initialized.
    if (typeof gdjs._yandexSDK !== "undefined" && gdjs._yandexSDK.isInitialized) {
        gdjs._pokiGamesSDKHtmlExtension.isSdkReady = true;
        logger.log("VK Bridge already initialized.");
        return;
    }

    // If VK Bridge is available but not yet initialized, init it now
    if (typeof gdjs._yandexSDK !== "undefined" && typeof vkBridge !== "undefined") {
        gdjs._yandexSDK.init().then(() => {
            gdjs._pokiGamesSDKHtmlExtension.isSdkReady = true;
            logger.log("VK Bridge successfully initialized.");
            return gdjs._yandexSDK.initPlayer();
        }).then(() => {
            return gdjs._yandexSDK.loadCloudData();
        }).catch((error) => {
            logger.log("VK Bridge initialization error: " + error);
        });
    } else {
        logger.log("VK Bridge not available, running in local mode.");
        gdjs._pokiGamesSDKHtmlExtension.isSdkReady = true;
    }
};
gdjs.evtsExt__PokiGamesSDKHtml__LoadSDK.eventsList0 = function(runtimeScene, eventsFunctionContext) {

    {


        gdjs.evtsExt__PokiGamesSDKHtml__LoadSDK.userFunc0x769b268(runtimeScene, typeof eventsFunctionContext !== 'undefined' ? eventsFunctionContext : undefined);

    }


};

gdjs.evtsExt__PokiGamesSDKHtml__LoadSDK.func = function(runtimeScene, parentEventsFunctionContext) {
    var eventsFunctionContext = {
        _objectsMap: {},
        _objectArraysMap: {},
        _behaviorNamesMap: {},
        globalVariablesForExtension: runtimeScene.getGame().getVariablesForExtension("PokiGamesSDKHtml"),
        sceneVariablesForExtension: runtimeScene.getScene().getVariablesForExtension("PokiGamesSDKHtml"),
        localVariables: [],
        getObjects: function(objectName) {
            return eventsFunctionContext._objectArraysMap[objectName] || [];
        },
        getObjectsLists: function(objectName) {
            return eventsFunctionContext._objectsMap[objectName] || null;
        },
        getBehaviorName: function(behaviorName) {
            return eventsFunctionContext._behaviorNamesMap[behaviorName] || behaviorName;
        },
        createObject: function(objectName) {
            const objectsList = eventsFunctionContext._objectsMap[objectName];
            if (objectsList) {
                const object = parentEventsFunctionContext ?
                    parentEventsFunctionContext.createObject(objectsList.firstKey()) :
                    runtimeScene.createObject(objectsList.firstKey());
                if (object) {
                    objectsList.get(objectsList.firstKey()).push(object);
                    eventsFunctionContext._objectArraysMap[objectName].push(object);
                }
                return object;
            }
            return null;
        },
        getInstancesCountOnScene: function(objectName) {
            const objectsList = eventsFunctionContext._objectsMap[objectName];
            let count = 0;
            if (objectsList) {
                for (const objectName in objectsList.items)
                    count += parentEventsFunctionContext ?
                    parentEventsFunctionContext.getInstancesCountOnScene(objectName) :
                    runtimeScene.getInstancesCountOnScene(objectName);
            }
            return count;
        },
        getLayer: function(layerName) {
            return runtimeScene.getLayer(layerName);
        },
        getArgument: function(argName) {
            return "";
        },
        getOnceTriggers: function() {
            return runtimeScene.getOnceTriggers();
        }
    };


    gdjs.evtsExt__PokiGamesSDKHtml__LoadSDK.eventsList0(runtimeScene, eventsFunctionContext);


    return;
}

gdjs.evtsExt__PokiGamesSDKHtml__LoadSDK.registeredGdjsCallbacks = [];