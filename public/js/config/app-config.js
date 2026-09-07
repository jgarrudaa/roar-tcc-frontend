const API_BASE_URL = "https://back-tcc-version-2.vercel.app";

const PAGE_ROUTES = Object.freeze({
    studentHome: "/pages/aluno/inicio.html",
    teacherHome: "/pages/professor/inicio.html",
    studentLogin: "/pages/auth/login-aluno.html",
    teacherLogin: "/pages/auth/login-professor.html",
    activity: "/pages/aluno/atividade.html",
});

export const APP_CONFIG = Object.freeze({
    apiBaseUrl: API_BASE_URL,
    useMocks: false,
    requestTimeoutMs: 8000,
    routes: PAGE_ROUTES,
});