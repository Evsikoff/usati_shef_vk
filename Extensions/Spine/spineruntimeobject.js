var gdjs;
(function(n) {
    class r extends n.RuntimeObject {
        constructor(i, e) {
            super(i, e);
            this._opacity = 255;
            this._scaleX = 1;
            this._scaleY = 1;
            this._flippedX = !1;
            this._flippedY = !1;
            this._currentAnimationIndex = -1;
            this._animationSpeedScale = 1;
            this._animationPaused = !1;
            this._isPausedFrameDirty = !1;
            this._animations = e.content.animations, this._originalScale = e.content.scale, this.spineResourceName = e.content.spineResourceName, this._animationMixingDuration = 0, this._renderer = new n.SpineRuntimeObjectRenderer(this, i), this.setAnimationIndex(0), this._renderer.updateAnimation(0), this.onCreated()
        }
        update(i) {
            if (this._animationPaused) {
                this._isPausedFrameDirty && (this._renderer.updateAnimation(0), this.invalidateHitboxes(), this._isPausedFrameDirty = !1);
                return
            }
            const e = this.getElapsedTime() / 1e3;
            this._renderer.updateAnimation(e * this._animationSpeedScale), this.invalidateHitboxes()
        }
        getRendererObject() {
            return this._renderer.getRendererObject()
        }
        updateFromObjectData(i, e) {
            return super.updateFromObjectData(i, e), i.content.scale !== e.content.scale && (this._originalScale = e.content.scale, this._renderer.updateScale(), this.invalidateHitboxes()), !0
        }
        getNetworkSyncData() {
            return { ...super.getNetworkSyncData(),
                opa: this._opacity,
                wid: this.getWidth(),
                hei: this.getHeight(),
                scaX: this.getScaleX(),
                scaY: this.getScaleY(),
                flipX: this.isFlippedX(),
                flipY: this.isFlippedY(),
                ani: this.getAnimationIndex(),
                anmd: this.getAnimationMixingDuration(),
                anp: this.isAnimationPaused(),
                anss: this.getAnimationSpeedScale(),
                anet: this.getAnimationElapsedTime()
            }
        }
        updateFromNetworkSyncData(i) {
            super.updateFromNetworkSyncData(i), i.opa !== void 0 && i.opa !== this._opacity && this.setOpacity(i.opa), i.wid !== void 0 && i.wid !== this.getWidth() && this.setWidth(i.wid), i.hei !== void 0 && i.hei !== this.getHeight() && this.setHeight(i.hei), i.scaX !== void 0 && i.scaX !== this.getScaleX() && this.setScaleX(i.scaX), i.scaY !== void 0 && i.scaY !== this.getScaleY() && this.setScaleY(i.scaY), i.flipX !== void 0 && i.flipX !== this.isFlippedX() && this.flipX(i.flipX), i.flipY !== void 0 && i.flipY !== this.isFlippedY() && this.flipY(i.flipY), i.ani !== void 0 && i.ani !== this.getAnimationIndex() && this.setAnimationIndex(i.ani), i.anmd !== void 0 && i.anmd !== this.getAnimationMixingDuration() && this.setAnimationMixingDuration(i.anmd), i.anp !== void 0 && i.anp !== this.isAnimationPaused() && (i.anp ? this.pauseAnimation() : this.resumeAnimation()), i.anss !== void 0 && i.anss !== this.getAnimationSpeedScale() && this.setAnimationSpeedScale(i.anss), i.anet !== void 0 && i.anet !== this.getAnimationElapsedTime() && this.setAnimationElapsedTime(i.anet)
        }
        extraInitializationFromInitialInstance(i) {
            const e = i.numberProperties.find(t => t.name === "animation"),
                s = e ? e.value : this._currentAnimationIndex;
            this.setAnimationIndexWithMixing(s, 0), i.customSize && (this.setSize(i.width, i.height), this.invalidateHitboxes()), i.opacity !== void 0 && this.setOpacity(i.opacity), i.flippedX && this.flipX(i.flippedX), i.flippedY && this.flipY(i.flippedY)
        }
        getDrawableX() {
            const i = this._renderer.getOriginOffset();
            return this.getX() + i.x
        }
        getDrawableY() {
            const i = this._renderer.getOriginOffset();
            return this.getY() + i.y
        }
        getCenterX() {
            return -this._renderer.getOriginOffset().x
        }
        getCenterY() {
            return -this._renderer.getOriginOffset().y
        }
        onDestroyed() {
            super.onDestroyed(), this._renderer.onDestroy()
        }
        setX(i) {
            super.setX(i), this._renderer.updatePosition()
        }
        setY(i) {
            super.setY(i), this._renderer.updatePosition()
        }
        setAngle(i) {
            super.setAngle(i), this._renderer.updateAngle()
        }
        setOpacity(i) {
            this._opacity = Math.max(0, Math.min(255, i)), this._renderer.updateOpacity()
        }
        getOpacity() {
            return this._opacity
        }
        getWidth() {
            return this._renderer.getWidth()
        }
        getHeight() {
            return this._renderer.getHeight()
        }
        setWidth(i) {
            const e = this._renderer.getUnscaledWidth();
            e !== 0 && this.setScaleX(i / e)
        }
        setHeight(i) {
            const e = this._renderer.getUnscaledHeight();
            e !== 0 && this.setScaleY(i / e)
        }
        setSize(i, e) {
            this.setWidth(i), this.setHeight(e)
        }
        setScale(i) {
            i < 0 && (i = 0), !(i === Math.abs(this._scaleX) && i === Math.abs(this._scaleY)) && (this._scaleX = i * (this._flippedX ? -1 : 1), this._scaleY = i * (this._flippedY ? -1 : 1), this._renderer.updateScale(), this.invalidateHitboxes())
        }
        setScaleX(i) {
            i < 0 && (i = 0), i !== Math.abs(this._scaleX) && (this._scaleX = i * (this._flippedX ? -1 : 1), this._renderer.updateScale(), this.invalidateHitboxes())
        }
        setScaleY(i) {
            i < 0 && (i = 0), i !== Math.abs(this._scaleY) && (this._scaleY = i * (this._flippedY ? -1 : 1), this._renderer.updateScale(), this.invalidateHitboxes())
        }
        getScale() {
            const i = Math.abs(this._scaleX),
                e = Math.abs(this._scaleY);
            return i === e ? i : Math.sqrt(i * e)
        }
        getScaleY() {
            return Math.abs(this._scaleY)
        }
        getScaleX() {
            return Math.abs(this._scaleX)
        }
        isFlippedX() {
            return this._flippedX
        }
        isFlippedY() {
            return this._flippedY
        }
        flipX(i) {
            i !== this._flippedX && (this._scaleX *= -1, this._flippedX = i, this.invalidateHitboxes(), this._renderer.updateScale())
        }
        flipY(i) {
            i !== this._flippedY && (this._scaleY *= -1, this._flippedY = i, this.invalidateHitboxes(), this._renderer.updateScale())
        }
        setAnimationIndex(i) {
            this.setAnimationIndexWithMixing(i, this._animationMixingDuration)
        }
        setAnimationIndexWithMixing(i, e) {
            if (this._animations.length === 0 || this._currentAnimationIndex === i || !this.isAnimationIndex(i)) return;
            const s = this._animations[this._currentAnimationIndex],
                t = this._animations[i];
            this._currentAnimationIndex = i, s && this._renderer.setMixing(s.source, t.source, e), this._renderer.setAnimation(t.source, t.loop), this._isPausedFrameDirty = !0
        }
        setAnimationName(i) {
            this.setAnimationNameWithMixing(i, this._animationMixingDuration)
        }
        setAnimationNameWithMixing(i, e) {
            this.setAnimationIndexWithMixing(this.getAnimationIndexFor(i), e)
        }
        getAnimationIndexFor(i) {
            return this._animations.findIndex(e => e.name === i)
        }
        getAnimationMixingDuration() {
            return this._animationMixingDuration
        }
        setAnimationMixingDuration(i) {
            this._animationMixingDuration = i
        }
        getAnimationIndex() {
            return this._currentAnimationIndex
        }
        getAnimationName() {
            return this.isAnimationIndex(this._currentAnimationIndex) ? this._animations[this._currentAnimationIndex].name : ""
        }
        isAnimationIndex(i) {
            return Number.isInteger(i) && i >= 0 && i < this._animations.length
        }
        hasAnimationEnded() {
            return this._renderer.isAnimationComplete()
        }
        isAnimationPaused() {
            return this._animationPaused
        }
        pauseAnimation() {
            this._animationPaused = !0
        }
        resumeAnimation() {
            this._animationPaused = !1
        }
        getAnimationSpeedScale() {
            return this._animationSpeedScale
        }
        setAnimationSpeedScale(i) {
            this._animationSpeedScale = i
        }
        getAnimationElapsedTime() {
            return this._animations.length === 0 ? 0 : this._renderer.getAnimationElapsedTime()
        }
        setAnimationElapsedTime(i) {
            this._animations.length !== 0 && (this._renderer.setAnimationElapsedTime(i), this._isPausedFrameDirty = !0)
        }
        getPointAttachmentX(i, e) {
            return this._renderer.getPointAttachmentPosition(i, e).x
        }
        getPointAttachmentY(i, e) {
            return this._renderer.getPointAttachmentPosition(i, e).y
        }
        getAnimationDuration() {
            return this._animations.length === 0 ? 0 : this._renderer.getAnimationDuration(this._animations[this._currentAnimationIndex].source)
        }
    }
    n.SpineRuntimeObject = r, n.registerObject("SpineObject::SpineObject", n.SpineRuntimeObject)
})(gdjs || (gdjs = {}));
//# sourceMappingURL=spineruntimeobject.js.map