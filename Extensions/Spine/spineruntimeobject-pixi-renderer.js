var gdjs;
(function(s) {
    const i = n => n instanceof pixi_spine.Spine,
        c = n => !!n && n.type === pixi_spine.AttachmentType.Point;
    class a {
        constructor(e, t) {
            this.instanceContainer = t;
            this._isAnimationComplete = !0;
            this._object = e, this._rendererObject = this.constructRendererObject(), i(this._rendererObject) && (this._rendererObject.autoUpdate = !1), this.updatePosition(), this.updateAngle(), this.updateOpacity(), this.updateScale(), t.getLayer("").getRenderer().addRendererObject(this._rendererObject, e.getZOrder())
        }
        updateAnimation(e) {
            !i(this._rendererObject) || this._rendererObject.update(e)
        }
        getRendererObject() {
            return this._rendererObject
        }
        getOriginOffset() {
            if (!i(this._rendererObject)) return new PIXI.Point(0, 0);
            const e = this._rendererObject.getLocalBounds(void 0, !0);
            return new PIXI.Point(e.x * this._rendererObject.scale.x, e.y * this._rendererObject.scale.y)
        }
        onDestroy() {
            this._rendererObject.destroy()
        }
        updateScale() {
            const e = Math.max(this._object._originalScale * this._object.getScaleX(), 0),
                t = Math.max(this._object._originalScale * this._object.getScaleY(), 0);
            this._rendererObject.scale.x = this._object.isFlippedX() ? -e : e, this._rendererObject.scale.y = this._object.isFlippedY() ? -t : t
        }
        updatePosition() {
            this._rendererObject.position.x = this._object.x, this._rendererObject.position.y = this._object.y
        }
        updateAngle() {
            this._rendererObject.rotation = s.toRad(this._object.angle)
        }
        updateOpacity() {
            this._rendererObject.alpha = this._object.getOpacity() / 255
        }
        getWidth() {
            return this._rendererObject.width
        }
        getHeight() {
            return this._rendererObject.height
        }
        setWidth(e) {
            this._rendererObject.width = e
        }
        setHeight(e) {
            this._rendererObject.height = e
        }
        getUnscaledWidth() {
            return Math.abs(this._rendererObject.width * this._object._originalScale / this._rendererObject.scale.x)
        }
        getUnscaledHeight() {
            return Math.abs(this._rendererObject.height * this._object._originalScale / this._rendererObject.scale.y)
        }
        setMixing(e, t, r) {
            !i(this._rendererObject) || this._rendererObject.stateData.setMix(e, t, r)
        }
        setAnimation(e, t) {
            if (i(this._rendererObject)) {
                const r = {
                    complete: () => {
                        this._isAnimationComplete = !0, this._rendererObject.state.removeListener(r)
                    }
                };
                this._isAnimationComplete = !1, this._rendererObject.state.addListener(r), this._rendererObject.state.setAnimation(0, e, t), this._rendererObject.update(0)
            }
        }
        getAnimationDuration(e) {
            if (!i(this._rendererObject)) return 0;
            const t = this._rendererObject.spineData.findAnimation(e);
            return t ? t.duration : 0
        }
        getAnimationElapsedTime() {
            if (!i(this._rendererObject)) return 0;
            const e = this._rendererObject.state.tracks;
            return e.length === 0 ? 0 : e[0].getAnimationTime()
        }
        setAnimationElapsedTime(e) {
            if (!i(this._rendererObject)) return;
            const t = this._rendererObject.state.tracks;
            if (t.length === 0) return;
            const r = t[0];
            r.trackTime = e
        }
        isAnimationComplete() {
            if (!i(this._rendererObject)) return !0;
            const e = this._rendererObject.state.tracks[0];
            return e ? this._isAnimationComplete && !e.loop : !0
        }
        getPointAttachmentPosition(e, t) {
            if (t || (t = e), !i(this._rendererObject)) return new pixi_spine.Vector2(this._rendererObject.x, this._rendererObject.y);
            const r = this._rendererObject.skeleton.findSlot(t);
            if (!r) throw new Error(`Unable to find ${t} slot name for ${e} point attachment.`);
            const o = this._rendererObject.skeleton.getAttachmentByName(t, e);
            if (!c(o)) throw new Error(`Unable to find ${e} point attachment with ${t} slot name.`);
            return new PIXI.Matrix().rotate(this._rendererObject.rotation).scale(this._rendererObject.scale.x, this._rendererObject.scale.y).translate(this._rendererObject.x, this._rendererObject.y).apply(o.computeWorldPosition(r.bone, new pixi_spine.Vector2))
        }
        constructRendererObject() {
            const t = this.instanceContainer.getGame().getSpineManager();
            return !t || !t.isSpineLoaded(this._object.spineResourceName) ? new PIXI.Container : new pixi_spine.Spine(t.getSpine(this._object.spineResourceName))
        }
    }
    s.SpineRuntimeObjectPixiRenderer = a, s.SpineRuntimeObjectRenderer = a
})(gdjs || (gdjs = {}));
//# sourceMappingURL=spineruntimeobject-pixi-renderer.js.map