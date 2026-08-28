/* Comportamento extraído de login-aluno.html. */

// --- Handle Login ---
        function handleLogin() {
            ROAR.init();
            window.location.href = '../aluno/inicio.html';
        }

        // --- Referências aos elementos do DOM ---
        const senhaInput       = document.getElementById('senha');
        const dino             = document.querySelector('.dino');
        const toggleSenhaIcon  = document.getElementById('toggleSenhaIcon');

        /**
         * Atualiza a imagem do mascote conforme o estado do campo de senha:
         * - Senha visível  → dino espiando
         * - Digitando      → dino tampando os olhos
         * - Vazio          → dino neutro
         */
        function atualizarEstadoDino() {
            if (!dino || !senhaInput) return;

            const temValor      = senhaInput.value.length > 0;
            const estaMostrando = senhaInput.type === 'text';

            if (estaMostrando) {
                dino.src = '../../public/assets/imagens/dino espiando.png';
            } else {
                dino.src = temValor
                    ? '../../public/assets/imagens/dinosenha.png'
                    : '../../public/assets/imagens/dinooriginal.png';
            }
        }

        // Atualiza o mascote ao digitar ou sair do campo de senha
        if (senhaInput) {
            senhaInput.addEventListener('input', () => {
                senhaInput.value = senhaInput.value.replace(/\D/g, '');
                atualizarEstadoDino();
            });
            senhaInput.addEventListener('blur',  atualizarEstadoDino);

            // Estado inicial ao carregar a página
            atualizarEstadoDino();
        }

        // Alterna a visibilidade da senha e sincroniza ícone + mascote
        if (senhaInput && toggleSenhaIcon) {
            const iconEye = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>`;
            const iconEyeSlash = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>`;

            toggleSenhaIcon.addEventListener('click', () => {
                const estaOculta = senhaInput.type === 'password';

                senhaInput.type        = estaOculta ? 'text' : 'password';
                toggleSenhaIcon.innerHTML = estaOculta ? iconEyeSlash : iconEye;
                toggleSenhaIcon.title  = estaOculta ? 'Ocultar senha' : 'Mostrar senha';

                atualizarEstadoDino();
            });
        }
