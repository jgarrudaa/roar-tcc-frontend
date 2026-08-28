export const APP_CONFIG = Object.freeze({
    apiBaseUrl: "http://localhost:5000/api/v1",
    useMocks: true,
    requestTimeoutMs: 8000,
    routes: Object.freeze({
        studentHome: "/pages/aluno/inicio.html",
        teacherHome: "/pages/professor/inicio.html",
        studentLogin: "/pages/auth/login-aluno.html",
        teacherLogin: "/pages/auth/login-professor.html",
        activity: "/pages/aluno/atividade.html",
    }),
});
