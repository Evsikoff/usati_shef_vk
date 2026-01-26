var gdjs;
(function(n) {
    const r = new n.Logger("Spine Manager"),
        c = ["spine"];
    class u {
        constructor(s, e) {
            this._loadedSpines = new n.ResourceCache;
            this._resourceLoader = s, this._spineAtlasManager = e
        }
        getResourceKinds() {
            return c
        }
        async processResource(s) {}
        async loadResource(s) {
            const e = this._getSpineResource(s);
            if (!e) return r.error(`Unable to find spine json for resource ${s}.`);
            try {
                const a = this._resourceLoader.getRuntimeGame(),
                    o = a.getEmbeddedResourcesNames(e.name);
                if (o.length !== 1) return r.error(`Unable to find atlas metadata for resource spine json ${s}.`);
                const d = a.resolveEmbeddedResource(e.name, o[0]),
                    l = await this._spineAtlasManager.getOrLoad(d),
                    t = this._resourceLoader.getFullUrl(e.file);
                PIXI.Assets.setPreferences({
                    preferWorkers: !1,
                    crossOrigin: this._resourceLoader.checkIfCredentialsRequired(t) ? "use-credentials" : "anonymous"
                }), PIXI.Assets.add({
                    alias: e.name,
                    src: t,
                    data: {
                        spineAtlas: l
                    }
                });
                const i = await PIXI.Assets.load(e.name);
                i.spineData ? this._loadedSpines.set(e, i.spineData) : r.error(`Loader cannot process spine resource ${e.name} correctly.`)
            } catch (a) {
                r.error(`Error while preloading spine resource ${e.name}: ${a}`)
            }
        }
        getSpine(s) {
            return this._loadedSpines.getFromName(s)
        }
        isSpineLoaded(s) {
            return !!this._loadedSpines.getFromName(s)
        }
        _getSpineResource(s) {
            const e = this._resourceLoader.getResource(s);
            return e && this.getResourceKinds().includes(e.kind) ? e : null
        }
        dispose() {
            this._loadedSpines.clear()
        }
    }
    n.SpineManager = u
})(gdjs || (gdjs = {}));
//# sourceMappingURL=pixi-spine-manager.js.map