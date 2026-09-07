import { APP_CONFIG } from "../../config/app-config.js";
import { sessionService } from "../../services/session-service.js";

const ALLOWED_ROLES = Object.freeze([
    "teacher",
    "student",
]);

const ROLE_DESTINATIONS = Object.freeze({
    teacher: Object.freeze({
        home: APP_CONFIG.routes.teacherHome,
        login: APP_CONFIG.routes.teacherLogin,
    }),

    student: Object.freeze({
        home: APP_CONFIG.routes.studentHome,
        login: APP_CONFIG.routes.studentLogin,
    }),
});

function getRequiredRole() {
    const requiredRole =
        document.body?.dataset.authRole;

    return ALLOWED_ROLES.includes(requiredRole)
        ? requiredRole
        : null;
}

function getRoleDestination(role, destination) {
    return ROLE_DESTINATIONS[role]?.[destination] ?? null;
}

function hideProtectedPage() {
    document.documentElement.style.visibility = "hidden";
}

function showProtectedPage() {
    document.documentElement.style.visibility = "";
}

function redirect(path) {
    hideProtectedPage();
    window.location.replace(path);
}

function clearInvalidSession() {
    sessionService.end();
}

function redirectUnauthenticatedUser(requiredRole) {
    clearInvalidSession();

    const loginRoute = getRoleDestination(
        requiredRole,
        "login",
    );

    redirect(
        loginRoute ?? APP_CONFIG.routes.studentLogin,
    );
}

function redirectUserWithWrongRole(session) {
    const homeRoute = getRoleDestination(
        session.role,
        "home",
    );

    if (homeRoute) {
        redirect(homeRoute);
        return;
    }

    clearInvalidSession();
    redirect(APP_CONFIG.routes.studentLogin);
}

export function requireRole(requiredRole) {
    if (!ALLOWED_ROLES.includes(requiredRole)) {
        console.error(
            `Papel de acesso inválido: ${requiredRole}`,
        );

        clearInvalidSession();
        redirect(APP_CONFIG.routes.studentLogin);

        return false;
    }

    const session = sessionService.get();

    if (!session) {
        redirectUnauthenticatedUser(requiredRole);
        return false;
    }

    if (session.role !== requiredRole) {
        redirectUserWithWrongRole(session);
        return false;
    }

    showProtectedPage();
    return true;
}

function handleInvalidSession() {
    const requiredRole =
        getRequiredRole() ?? "student";

    redirectUnauthenticatedUser(requiredRole);
}

function initializeRouteGuard() {
    const requiredRole = getRequiredRole();

    if (!requiredRole) {
        console.error(
            "A página protegida não declarou data-auth-role.",
        );

        clearInvalidSession();
        redirect(APP_CONFIG.routes.studentLogin);

        return;
    }

    requireRole(requiredRole);

    window.addEventListener(
        "roar:session-invalid",
        handleInvalidSession,
    );
}

initializeRouteGuard();