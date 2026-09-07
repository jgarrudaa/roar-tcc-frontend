import { showToast } from "../../components/toast.js";
import { professorService } from "../../services/professor-service.js";
import { sessionService } from "../../services/session-service.js";


const elements = {
    form: document.getElementById("profileForm"),

    profileName:
        document.getElementById("profileName"),

    profileEmail:
        document.getElementById("profileEmail"),

    profileAvatar:
        document.getElementById("profileAvatar"),

    navbarAvatar:
        document.getElementById("navbarAvatar"),

    nameInput:
        document.getElementById("profileNameInput"),

    emailInput:
        document.getElementById("profileEmailInput"),

    cpfInput:
        document.getElementById("profileCpfInput"),

    profileId:
        document.getElementById("profileId"),

    createdAt:
        document.getElementById("profileCreatedAt"),

    statusMessage:
        document.getElementById("profileStatusMessage"),

    saveButton:
        document.getElementById("saveProfileButton"),

    resetButton:
        document.getElementById("resetProfileButton"),

    nameError:
        document.getElementById("profileNameError"),

    emailError:
        document.getElementById("profileEmailError"),

    cpfError:
        document.getElementById("profileCpfError"),
};


const state = {
    teacherId: null,
    originalProfile: null,
    isLoading: false,
    isSaving: false,
};


function requireElements() {
    const missingElements =
        Object.entries(elements)
            .filter(([, element]) => !element)
            .map(([name]) => name);

    if (missingElements.length) {
        throw new Error(
            `Elementos ausentes no perfil: ${missingElements.join(", ")}.`,
        );
    }
}


function getTeacherId() {
    const session = sessionService.get();

    const teacherId = Number(
        session?.user?.id ??
        session?.user?.professor_id ??
        session?.professor_id,
    );

    if (
        !Number.isInteger(teacherId) ||
        teacherId <= 0
    ) {
        throw new Error(
            "Não foi possível identificar o professor autenticado.",
        );
    }

    return teacherId;
}


function setFormDisabled(disabled) {
    elements.nameInput.disabled = disabled;
    elements.emailInput.disabled = disabled;
    elements.cpfInput.disabled = disabled;
    elements.saveButton.disabled = disabled;
    elements.resetButton.disabled = disabled;
}


function setStatus(message) {
    elements.statusMessage.textContent = message;
}


function clearErrors() {
    elements.nameError.textContent = "";
    elements.emailError.textContent = "";
    elements.cpfError.textContent = "";

    elements.nameInput.removeAttribute(
        "aria-invalid",
    );

    elements.emailInput.removeAttribute(
        "aria-invalid",
    );

    elements.cpfInput.removeAttribute(
        "aria-invalid",
    );
}


function setFieldError(input, errorElement, message) {
    input.setAttribute(
        "aria-invalid",
        "true",
    );

    errorElement.textContent = message;
}


function renderProfile(profile) {
    elements.profileName.textContent =
        profile.name;

    elements.profileEmail.textContent =
        profile.email;

    elements.profileAvatar.textContent =
        profile.initials;

    elements.navbarAvatar.textContent =
        profile.initials;

    elements.navbarAvatar.title =
        profile.name;

    elements.nameInput.value =
        profile.name;

    elements.emailInput.value =
        profile.email;

    elements.cpfInput.value =
        profile.formattedCpf;

    elements.profileId.textContent =
        String(profile.id);

    elements.createdAt.textContent =
        profile.formattedCreatedAt;
}


function updateSessionProfile(profile) {
    const currentSession =
        sessionService.get();

    if (!currentSession) {
        return;
    }

    const currentUser =
        currentSession.user ?? {};

    sessionService.start({
        ...currentSession,

        user: {
            ...currentUser,

            id:
                currentUser.id ??
                profile.id,

            name: profile.name,
            nome: profile.name,
            email: profile.email,
        },
    });
}


function applyCpfMask(value) {
    const digits = String(value ?? "")
        .replace(/\D/g, "")
        .slice(0, 11);

    if (digits.length <= 3) {
        return digits;
    }

    if (digits.length <= 6) {
        return digits.replace(
            /^(\d{3})(\d+)/,
            "$1.$2",
        );
    }

    if (digits.length <= 9) {
        return digits.replace(
            /^(\d{3})(\d{3})(\d+)/,
            "$1.$2.$3",
        );
    }

    return digits.replace(
        /^(\d{3})(\d{3})(\d{3})(\d{1,2})$/,
        "$1.$2.$3-$4",
    );
}


function validateForm() {
    clearErrors();

    const name =
        elements.nameInput.value.trim();

    const email =
        elements.emailInput.value
            .trim()
            .toLowerCase();

    const cpf =
        elements.cpfInput.value
            .replace(/\D/g, "");

    let isValid = true;

    if (name.length < 3) {
        setFieldError(
            elements.nameInput,
            elements.nameError,
            "Informe um nome com pelo menos 3 caracteres.",
        );

        isValid = false;
    }

    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email,
        )
    ) {
        setFieldError(
            elements.emailInput,
            elements.emailError,
            "Informe um endereço de e-mail válido.",
        );

        isValid = false;
    }

    if (cpf.length !== 11) {
        setFieldError(
            elements.cpfInput,
            elements.cpfError,
            "O CPF deve possuir 11 números.",
        );

        isValid = false;
    }

    if (/^(\d)\1{10}$/.test(cpf)) {
        setFieldError(
            elements.cpfInput,
            elements.cpfError,
            "Informe um CPF válido.",
        );

        isValid = false;
    }

    if (!isValid) {
        const firstInvalidField =
            elements.form.querySelector(
                '[aria-invalid="true"]',
            );

        firstInvalidField?.focus();
        return null;
    }

    return {
        name,
        email,
        cpf,
    };
}


function resetForm() {
    if (!state.originalProfile) {
        return;
    }

    clearErrors();
    renderProfile(state.originalProfile);

    setStatus(
        "As alterações não salvas foram canceladas.",
    );
}


async function loadProfile() {
    if (state.isLoading) {
        return;
    }

    state.isLoading = true;
    setFormDisabled(true);
    setStatus("Carregando seus dados...");

    try {
        const profile =
            await professorService.getProfile(
                state.teacherId,
            );

        state.originalProfile = profile;

        renderProfile(profile);
        updateSessionProfile(profile);

        setFormDisabled(false);
        setStatus(
            "Seus dados estão atualizados.",
        );
    } catch (error) {
        console.error(
            "Erro ao carregar perfil:",
            error,
        );

        setStatus(
            "Não foi possível carregar o perfil.",
        );

        showToast(
            error?.message ??
            "Não foi possível carregar seu perfil.",
            "error",
        );
    } finally {
        state.isLoading = false;
    }
}


async function saveProfile(event) {
    event.preventDefault();

    if (
        state.isSaving ||
        state.isLoading
    ) {
        return;
    }

    const profileData = validateForm();

    if (!profileData) {
        showToast(
            "Revise os dados informados.",
            "warning",
        );

        return;
    }

    state.isSaving = true;
    setFormDisabled(true);

    elements.saveButton.textContent =
        "Salvando...";

    setStatus(
        "Salvando suas alterações...",
    );

    try {
        const result =
            await professorService.updateProfile(
                state.teacherId,
                profileData,
            );

        state.originalProfile =
            result.profile;

        renderProfile(result.profile);
        updateSessionProfile(result.profile);

        setStatus(
            "Perfil atualizado com sucesso.",
        );

        showToast(
            result.message,
            "success",
        );
    } catch (error) {
        console.error(
            "Erro ao atualizar perfil:",
            error,
        );

        setStatus(
            "Não foi possível salvar as alterações.",
        );

        showToast(
            error?.message ??
            "Não foi possível atualizar o perfil.",
            "error",
        );
    } finally {
        state.isSaving = false;

        elements.saveButton.textContent =
            "Salvar alterações";

        setFormDisabled(false);
    }
}


function registerEvents() {
    elements.form.addEventListener(
        "submit",
        saveProfile,
    );

    elements.resetButton.addEventListener(
        "click",
        resetForm,
    );

    elements.cpfInput.addEventListener(
        "input",
        (event) => {
            event.target.value =
                applyCpfMask(
                    event.target.value,
                );
        },
    );

    elements.nameInput.addEventListener(
        "input",
        () => {
            elements.nameError.textContent = "";
            elements.nameInput.removeAttribute(
                "aria-invalid",
            );
        },
    );

    elements.emailInput.addEventListener(
        "input",
        () => {
            elements.emailError.textContent = "";
            elements.emailInput.removeAttribute(
                "aria-invalid",
            );
        },
    );

    elements.cpfInput.addEventListener(
        "input",
        () => {
            elements.cpfError.textContent = "";
            elements.cpfInput.removeAttribute(
                "aria-invalid",
            );
        },
    );
}


async function initialize() {
    try {
        requireElements();

        state.teacherId =
            getTeacherId();

        registerEvents();

        await loadProfile();
    } catch (error) {
        console.error(
            "Erro ao inicializar perfil:",
            error,
        );

        setStatus(
            "Não foi possível inicializar o perfil.",
        );

        showToast(
            error?.message ??
            "Não foi possível abrir o perfil.",
            "error",
        );
    }
}


initialize();