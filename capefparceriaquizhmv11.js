async function finalizarComQuiz(cpf, linkunico,codigo) {
    await setupToken();
    if (await checkLINKUNICO(cpf, linkunico)) {
        let eventoValor;       
        var evento = codigo;
        if (evento == 21) {
            eventoValor = 21;
        } else if (evento == 16) {
            eventoValor = 16;
        }
        if (eventoValor) {

            if (await validarPontuar(cpf)) {

                await pontuarCPF(cpf, eventoValor, linkunico);
            }
        }
    }

}
async function validarPontuar(cpf) {
    return await checkCPF(cpf);

}
// const urlAPI = "https://apiparceriapremiada.capef.com.br"; //producao
const urlAPI = "https://ici002.capef.com.br/apiparceriapremiada"; //homolog
const authUserName = "Hero99";
const authPassword = "d7OwsEqTXc";
async function setupToken() {
    const authResponse = await fetch(`${urlAPI}/auth/access-token`, {
        method: "POST",
        body: JSON.stringify({
            username: authUserName,
            password: authPassword
        }),
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!authResponse.ok) {
        throw new Error("Failed to obtain authentication token");
    }

    const authData = await authResponse.json();
    token = authData.access_Token;
    localStorage.setItem('authToken', token);
}
async function authFetch(url, options = {}) {
    try {
        let token = localStorage.getItem('authToken');
        const headers = {
            ...options.headers,
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        };
        const dataResponse = await fetch(url, {
            ...options,
            headers
        });

        if (dataResponse.status === 401) {
            localStorage.removeItem("authToken");
            await setupToken();
        }

        if (dataResponse.status === 400) {
            const result = await dataResponse.json();

            return {
                status: dataResponse.status,
                data: result[0]
            }
        }
        if (dataResponse.status === 204) {
            return {
                status: dataResponse.status
            }
        }
        if (!dataResponse.ok) {
            if (dataResponse.status === 415) {

            } else if (await dataResponse.json()) {
                const result = await dataResponse.json();
                return {
                    error: result[0],
                    status: dataResponse.status
                }
            } else {
                return {
                    status: dataResponse.status
                }
            }
        } else {
            const data = await dataResponse.json();
            return data;
        }

    } catch (error) {
        return error
    }
}
const apiparceria = authFetch;
async function checkCPF(cpf) {
    const response = await apiparceria(`${urlAPI}/CPF/${cpf}`);
    const data = await response;

    if (data.id === "NaoEParticipante") {
        $('.w-form-done').toggleClass('w-form-done w-form-fail').text("CPF não habilitado para o programa.");
        return false;
    }

    const valido = data.id !== null && data.id !== undefined;
    if (!valido) {
        $('.w-form-done').toggleClass('w-form-done w-form-fail').text("CPF não cadastrado no Programa.");
    }
    return valido;
}
async function checkLINKUNICO(cpf, linkunico) {
    const body = {
        "CPF": cpf,
        "linkunico": linkunico
    }

    const response = await apiparceria(`${urlAPI}/CPF/verificarlink`, {
        method: "POST",
        body: JSON.stringify(body)
    });
    const data = await response;
    if (data.status == 400) {
        $('.w-form-done').toggleClass('w-form-done w-form-fail').text("Você já pontuou neste conteúdo.");
    } else {
        return data.id !== null && data.id !== undefined;
    }
}
async function pontuarCPF(cpf, evento, linkunico) {
    const pontosJson = {
        "CPF": cpf,
        "EventoId": evento,
        "linkunico": linkunico
    }
    const response = await apiparceria(`${urlAPI}/Pontos/com-link-unico`, {
        method: "POST",
        body: JSON.stringify(pontosJson)
    });

    if (response.chamadoPontuacaoId) {
        $('.w-form-done').text("Seus pontos foram creditados com sucesso!");
    } else {
        console.error("Erro ao adicionar pontuação:", response.statusText);
    }
}
$(document).ready(function () {
    $('.button-parceria').click(function () {       
        var inputCpf = $('#cpf-parceria');
        var valorCpf = inputCpf.val();
        var cpf = valorCpf;
        var quiz = true;
        const linkunico = window.location.href;

        var idEvento = $('#Evento-Quiz').val();
        var CODIGO;

        if (idEvento === "Acontece") {
            CODIGO = 21; // Código para o evento "Acontece"
        } else if (idEvento === "Relatorio Anual") {
            CODIGO = 16; // Código para o evento "Relatorio Anual"
        } else {
            console.error("Id do evento inválido");
            CODIGO = 16; // Definir o valor padrão como 16
        }

        if (quiz) {
            finalizarComQuiz(cpf, linkunico, CODIGO);
        }
    });
});
