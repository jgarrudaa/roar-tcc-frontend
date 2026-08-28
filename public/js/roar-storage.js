/* ============================================================
   ROAR — roar-storage.js
   LocalStorage centralizado para toda a plataforma
   ============================================================ */

const ROAR = {
    STORAGE_KEY: 'roarData',

    /* Dados padrão para testes */
    defaults: {
        userName: 'Leandro',
        userInitial: 'L',
        xp: 1240,
        nivel: 2,           /* 1=Suporte Visual Puro | 2=Aprendiz Guiado | 3=Autonomia Contextural */
        streak: 7,
        progressoGeral: 40,
        progress: {},        /* { "corpo-humano": { etapaAtual:1, acertos:5, erros:1, xpGanho:30 } } */

        heroCat: {
            name: 'Corpo Humano',
            progress: 70,
            icon: 'fi fi-br-portrait',
            link: '/pages/aluno/atividade.html?modulo=corpo-humano&etapa=1'
        },

        recent: [
            { name: 'Corpo Humano', cat: 'Vocabulário', xp: 50, icon: 'fi fi-br-portrait', color: 'a' },
            { name: 'Cores',        cat: 'Vocabulário', xp: 40, icon: 'fi fi-br-palette',  color: 'b' },
            { name: 'Emoções',      cat: 'Vocabulário', xp: 35, icon: 'fi fi-br-astonished-face', color: 'b' },
        ]
    },

    /* Lê os dados do localStorage (ou retorna defaults) */
    get() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return { ...this.defaults };
            
            let parsed = JSON.parse(raw);
            if (parsed.recent) {
                parsed.recent.forEach(r => {
                    if (r.name === 'Emoções') r.icon = 'fi fi-br-astonished-face';
                });
            }
            return { ...this.defaults, ...parsed };
        } catch (e) {
            console.warn('ROAR Storage: erro ao ler localStorage', e);
            return { ...this.defaults };
        }
    },

    /* Salva dados no localStorage */
    save(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('ROAR Storage: erro ao salvar localStorage', e);
        }
    },

    /* Inicializa o localStorage se estiver vazio */
    init() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            this.save(this.defaults);
        }
        return this.get();
    },

    /* Atualiza campos específicos sem apagar o resto */
    update(fields) {
        const data = this.get();
        Object.assign(data, fields);
        this.save(data);
        return data;
    },

    /* Salva progresso de uma atividade específica */
    saveProgress(activityId, progressData) {
        const data = this.get();
        if (!data.progress) data.progress = {};
        data.progress[activityId] = {
            ...data.progress[activityId],
            ...progressData,
            completadoEm: new Date().toISOString()
        };
        this.save(data);
        return data;
    },

    /* Adiciona XP */
    addXP(amount) {
        const data = this.get();
        data.xp = (data.xp || 0) + amount;
        this.save(data);
        return data;
    },

    /* Labels de nível TEA */
    nivelLabels: {
        1: { text: 'Nível 1 — Suporte Visual Puro',  short: 'N1', cls: 'nivel-1' },
        2: { text: 'Nível 2 — Aprendiz Guiado',      short: 'N2', cls: 'nivel-2' },
        3: { text: 'Nível 3 — Autonomia Contextural', short: 'N3', cls: 'nivel-3' },
    },

    /* Limpa tudo (para testes) */
    reset() {
        localStorage.removeItem(this.STORAGE_KEY);
        return this.init();
    }
};
