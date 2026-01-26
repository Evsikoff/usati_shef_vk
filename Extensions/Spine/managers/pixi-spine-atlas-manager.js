var gdjs;
(function(u) {
    const c = ["atlas"];
    class g {
        constructor(e, s) {
            this._loadedSpineAtlases = new u.ResourceCache;
            this._loadingSpineAtlases = new u.ResourceCache;
            this._resourceLoader = e, this._imageManager = s
        }
        getResourceKinds() {
            return c
        }
        async processResource(e) {}
        async loadResource(e) {
            await this.getOrLoad(e)
        }
        getOrLoad(e) {
            const s = this._getAtlasResource(e);
            if (!s) return Promise.reject(`Unable to find atlas for resource '${e}'.`);
            let t = this._loadingSpineAtlases.get(s);
            return t || (t = new Promise((n, a) => {
                const o = (i, r) => {
                    if (i) return a(`Error while preloading a spine atlas resource: ${i}`);
                    if (!r) return a(`Cannot reach texture atlas for resource '${e}'.`);
                    n(r)
                };
                this.load(s, o)
            }), this._loadingSpineAtlases.set(s, t)), t
        }
        load(e, s) {
            const t = this._resourceLoader.getRuntimeGame(),
                n = t.getEmbeddedResourcesNames(e.name);
            if (!n.length) return s(new Error(`${e.name} do not have image metadata!`));
            const a = n.reduce((r, l) => {
                    const d = t.resolveEmbeddedResource(e.name, l);
                    return r[l] = this._imageManager.getOrLoadPIXITexture(d), r
                }, {}),
                o = r => {
                    this._loadedSpineAtlases.set(e, r), s(null, r)
                },
                i = this._resourceLoader.getFullUrl(e.file);
            PIXI.Assets.setPreferences({
                preferWorkers: !1,
                crossOrigin: this._resourceLoader.checkIfCredentialsRequired(i) ? "use-credentials" : "anonymous"
            }), PIXI.Assets.add({
                alias: e.name,
                src: i,
                data: {
                    images: a
                }
            }), PIXI.Assets.load(e.name).then(r => {
                typeof r == "string" ? new pixi_spine.TextureAtlas(r, (l, d) => d(a[l].baseTexture), o) : o(r)
            })
        }
        isLoaded(e) {
            return !!this._loadedSpineAtlases.getFromName(e)
        }
        getAtlasTexture(e) {
            return this._loadedSpineAtlases.getFromName(e)
        }
        _getAtlasResource(e) {
            const s = this._resourceLoader.getResource(e);
            return s && this.getResourceKinds().includes(s.kind) ? s : null
        }
        dispose() {
            this._loadedSpineAtlases.clear(), this._loadingSpineAtlases.clear()
        }
    }
    u.SpineAtlasManager = g
})(gdjs || (gdjs = {}));
//# sourceMappingURL=pixi-spine-atlas-manager.js.map