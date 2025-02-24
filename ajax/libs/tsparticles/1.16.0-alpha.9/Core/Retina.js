"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Retina = void 0;
class Retina {
    constructor(container) {
        this.container = container;
    }
    init() {
        var _a;
        const container = this.container;
        const options = container.options;
        if (options.detectRetina) {
            this.pixelRatio = typeof window === "undefined" ? 1 : window.devicePixelRatio;
        }
        else {
            this.pixelRatio = 1;
        }
        const ratio = this.pixelRatio;
        if (container.canvas.element) {
            const element = container.canvas.element;
            container.canvas.size.width = element.offsetWidth * ratio;
            container.canvas.size.height = element.offsetHeight * ratio;
        }
        const particles = options.particles;
        this.linksDistance = particles.links.distance * ratio;
        this.linksWidth = particles.links.width * ratio;
        this.moveSpeed = particles.move.speed * ratio;
        this.sizeValue = particles.size.value * ratio;
        this.sizeAnimationSpeed = particles.size.animation.speed * ratio;
        const modes = options.interactivity.modes;
        this.connectModeDistance = modes.connect.distance * ratio;
        this.connectModeRadius = modes.connect.radius * ratio;
        this.grabModeDistance = modes.grab.distance * ratio;
        this.repulseModeDistance = modes.repulse.distance * ratio;
        this.slowModeRadius = modes.slow.radius * ratio;
        this.bubbleModeDistance = modes.bubble.distance * ratio;
        this.bubbleModeSize = ((_a = modes.bubble.size) !== null && _a !== void 0 ? _a : this.sizeValue * 2) * ratio;
    }
    initParticle(particle) {
        const particlesOptions = particle.particlesOptions;
        const ratio = this.pixelRatio;
        particle.linksDistance = particlesOptions.links.distance * ratio;
        particle.linksWidth = particlesOptions.links.width * ratio;
        particle.moveSpeed = particlesOptions.move.speed * ratio;
        particle.sizeValue = particlesOptions.size.value * ratio;
        if (typeof particlesOptions.size.random !== "boolean") {
            particle.randomMinimumSize = particlesOptions.size.random.minimumValue * ratio;
        }
        particle.sizeAnimationSpeed = particlesOptions.size.animation.speed * ratio;
    }
}
exports.Retina = Retina;
