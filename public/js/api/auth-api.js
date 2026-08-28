import { request } from "./api-client.js";

export const authApi = Object.freeze({
    loginStudent: (credentials) => request("/auth/aluno/login", {
        method: "POST",
        body: JSON.stringify(credentials),
    }),
    loginTeacher: (credentials) => request("/auth/professor/login", {
        method: "POST",
        body: JSON.stringify(credentials),
    }),
    registerTeacher: (data) => request("/auth/professor/cadastro", {
        method: "POST",
        body: JSON.stringify(data),
    }),
});
