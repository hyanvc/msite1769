async function finalizar(cpf, linkunico) {
    await setupToken();
    if (await checkLINKUNICO(cpf, linkunico)) {
        let eventoValor;
        var eventoid = document.getElementById("Evento-Parceria");
        var evento = eventoid.value;

        if (evento.includes("Notícias")) {
            eventoValor = 19;
        } else if (evento.includes("Mercado em foco")) {
            eventoValor = 20;
        } else if (evento.includes("TV Capef")) {
            eventoValor = 18;
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

const urlAPI = "https://apiparceriapremiada.capef.com.br"; //producao
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
    var valido =  data.id !== null && data.id !== undefined;
    if(!valido)
    {
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
    var eventoid = document.getElementById("Evento-Parceria");
    let iddobotao;
    let contemcodigo = false;
    var evento = eventoid.value;
    if (evento.includes("Notícias")) {
        iddobotao = "btnparceria-noticias";
    } else if (evento.includes("Mercado em foco")) {
        iddobotao = "btnparceria-mef";
    } else if (evento.includes("TV Capef")) {
        iddobotao = "btnparceria-tvcapef";
    }

    $('#' + iddobotao).click(function () {

        let idcodigo;
        var evento = eventoid.value;
        if (evento.includes("Notícias")) {
            idcodigo = "-noticias";
        } else if (evento.includes("Mercado em foco")) {
            idcodigo = "-mef";
        } else if (evento.includes("TV Capef")) {
            idcodigo = "-tvcapef";
        }

        var iddocodigo = "C-digo-do-conte-do-3" + idcodigo;
        var inputElement = $('#' + iddocodigo);
        var inputCpf = $('#cpf-parceria' + idcodigo);

        var valorCpf = inputCpf.val();
        var cpf = valorCpf;
        if (inputElement.length > 0) {
            var codigodigitado = inputElement.val();
        }
        let respostacodigo;
        if(!idcodigo.includes("noticia"))
            {
             respostacodigo = $('#codigopontuacao' + idcodigo).val();
             contemcodigo = true;
            } else
            
            {
                respostacodigo = 0;
            }

        var codigo = respostacodigo;
        const linkunico = window.location.href;

        if(contemcodigo)
        {
            if(codigo != codigodigitado)
            {
                $('.w-form-done').toggleClass('w-form-done w-form-fail').text("Código inválido para o vídeo.");
                return;

            }
        }


        if (codigodigitado != null && codigodigitado != "") {
            if (codigodigitado != null && codigodigitado != "") {
                if (codigo === codigodigitado) {
                    finalizar(cpf, linkunico);
                }
            } else { }
        } else {
            if(!idcodigo.includes("noticia"))
            {
                if (inputElement.length > 0) {
                    finalizar(cpf, linkunico);
                }
            } else
            {
                finalizar(cpf, linkunico);

            }
           
        }
    });
});
