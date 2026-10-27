// Recursos pertencem à rodada: sair impede eventos e callbacks atrasados.
export function createActivityLifecycle() {
    let destroyed = false;
    const timers = new Set();
    const frames = new Set();
    const listeners = [];
    return {
        get destroyed() { return destroyed; },
        listen(target, type, handler, options) {
            if (destroyed) return;
            const guarded = function (...args) {
                if (!destroyed) return handler.apply(this, args);
            };
            target.addEventListener(type, guarded, options);
            listeners.push(() => target.removeEventListener(type, guarded, options));
        },
        timeout(callback, delay) {
            if (destroyed) return;
            const id = window.setTimeout(() => {
                timers.delete(id);
                if (!destroyed) callback();
            }, delay);
            timers.add(id);
            return id;
        },
        frame(callback) {
            if (destroyed) return;
            const id = window.requestAnimationFrame(time => {
                frames.delete(id);
                if (!destroyed) callback(time);
            });
            frames.add(id);
            return id;
        },
        destroy() {
            if (destroyed) return;
            destroyed = true;
            timers.forEach(id => window.clearTimeout(id));
            frames.forEach(id => window.cancelAnimationFrame(id));
            listeners.forEach(remove => remove());
            timers.clear();
            frames.clear();
            listeners.length = 0;
        },
    };
}
