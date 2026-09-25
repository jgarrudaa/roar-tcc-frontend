/* ============================================================
   ROAR — roar-sound-fx.js
   Efeitos sonoros breves, intuitivos e suaves via Web Audio API.
   Projetado para acessibilidade cognitiva e conforto auditivo.
   ============================================================ */

class RoarSoundFx {
    constructor() {
        this._ctx = null;
        this._lastClickTime = 0;
        this._initListeners();
    }

    _getContext() {
        if (!this._ctx && typeof window !== "undefined") {
            const AudioContextClass =
                window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this._ctx = new AudioContextClass();
            }
        }

        if (this._ctx && this._ctx.state === "suspended") {
            this._ctx.resume().catch(() => {});
        }

        return this._ctx;
    }

    _getPreferences() {
        try {
            const raw = localStorage.getItem("roarPreferences");
            const prefs = raw ? JSON.parse(raw) : {};
            const enabled = prefs.soundsEnabled !== false;
            const volumePct = Math.min(100, Math.max(0, Number(prefs.volume ?? 80)));
            const reducedStimuli = Boolean(prefs.reducedStimuli);

            // Volume base suave (máximo 0.22 do ganho para evitar sons estridentes)
            let masterGain = (volumePct / 100) * 0.22;
            if (reducedStimuli) {
                masterGain *= 0.65;
            }

            return { enabled, masterGain };
        } catch {
            return { enabled: true, masterGain: 0.18 };
        }
    }

    /**
     * Som de toque/clique: suave, discreto e tátil (tipo gota/madeira macia).
     */
    playClick() {
        const { enabled, masterGain } = this._getPreferences();
        if (!enabled || masterGain <= 0) return;

        const now = Date.now();
        if (now - this._lastClickTime < 60) return; // Evita cliques duplicados em curto intervalo
        this._lastClickTime = now;

        const ctx = this._getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const t = ctx.currentTime;
        osc.type = "sine";
        osc.frequency.setValueAtTime(380, t);
        osc.frequency.exponentialRampToValueAtTime(180, t + 0.035);

        gain.gain.setValueAtTime(masterGain * 0.45, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.035);
    }

    /**
     * Som de acerto/sucesso: sino harmônico suave ascendente de 2 notas (C5 -> G5).
     */
    playSuccess() {
        const { enabled, masterGain } = this._getPreferences();
        if (!enabled || masterGain <= 0) return;

        const ctx = this._getContext();
        if (!ctx) return;

        const notes = [523.25, 783.99]; // C5 e G5
        const noteDuration = 0.085;

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = ctx.currentTime + i * 0.065;

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(masterGain * 0.6, t + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + noteDuration + 0.04);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(t);
            osc.stop(t + noteDuration + 0.04);
        });
    }

    /**
     * Som amigável de tentar novamente: tom duplo discreto e grave, sem aspereza.
     */
    playTryAgain() {
        const { enabled, masterGain } = this._getPreferences();
        if (!enabled || masterGain <= 0) return;

        const ctx = this._getContext();
        if (!ctx) return;

        const notes = [260, 210];
        const noteDuration = 0.07;

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = ctx.currentTime + i * 0.06;

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(masterGain * 0.45, t + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + noteDuration + 0.03);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(t);
            osc.stop(t + noteDuration + 0.03);
        });
    }

    /**
     * Som de conquista/missão: arpejo delicado e alegre de 3 notas (C5 -> E5 -> G5).
     */
    playAchievement() {
        const { enabled, masterGain } = this._getPreferences();
        if (!enabled || masterGain <= 0) return;

        const ctx = this._getContext();
        if (!ctx) return;

        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        const noteDuration = 0.11;

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = ctx.currentTime + i * 0.07;

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(masterGain * 0.7, t + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + noteDuration + 0.08);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(t);
            osc.stop(t + noteDuration + 0.08);
        });
    }

    /**
     * Som de alternar interruptor/toggle: micro-clique nítido.
     */
    playToggle(checked = true) {
        const { enabled, masterGain } = this._getPreferences();
        if (!enabled || masterGain <= 0) return;

        const ctx = this._getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime;

        osc.type = "triangle";
        osc.frequency.setValueAtTime(checked ? 580 : 420, t);

        gain.gain.setValueAtTime(masterGain * 0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.025);
    }

    /**
     * Pré-visualização de volume (usado ao arrastar o controle em Configurações).
     */
    playTonePreview(volumePercent = 80) {
        const ctx = this._getContext();
        if (!ctx) return;

        const vol = Math.min(100, Math.max(0, Number(volumePercent))) / 100;
        if (vol <= 0) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = ctx.currentTime;

        osc.type = "sine";
        osc.frequency.setValueAtTime(659.25, t); // E5 suave

        const targetGain = vol * 0.22;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(targetGain * 0.6, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.09);
    }

    /**
     * Vincula listeners de delegação para elementos interativos em páginas do aluno.
     */
    _initListeners() {
        if (typeof document === "undefined") return;

        const setup = () => {
            document.addEventListener(
                "click",
                (event) => {
                    const target = event.target;
                    if (!target || !(target instanceof Element)) return;

                    // Não reproduz se o clique for dentro de campos de digitação
                    if (
                        target.closest("input:not([type='button']):not([type='submit']):not([type='checkbox']):not([type='range'])") ||
                        target.closest("textarea") ||
                        target.closest("select")
                    ) {
                        return;
                    }

                    // Elementos com som explícito ou interativos padrão do aluno
                    const clickable = target.closest(
                        "button, .sidebar__link, .shortcut-btn, .theme-option, .fs-btn, .module-card, .stat-card, .medal-big, .modal__close, .toggle, [data-sound='click']"
                    );

                    if (clickable) {
                        // Se for um toggle de checkbox, toca o som apropriado
                        if (clickable.classList.contains("toggle")) {
                            const input = clickable.querySelector("input[type='checkbox']");
                            this.playToggle(input ? input.checked : true);
                            return;
                        }

                        this.playClick();
                    }
                },
                { passive: true }
            );
        };

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", setup, { once: true });
        } else {
            setup();
        }
    }
}

export const soundFx = new RoarSoundFx();

// Disponível globalmente para compatibilidade em qualquer script antigo ou inline
if (typeof window !== "undefined") {
    window.roarSound = soundFx;
}
