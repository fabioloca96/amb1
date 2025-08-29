document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("contatti-form");
    const confermaMessaggio = document.getElementById("conferma-messaggio");

    form.addEventListener("submit", function(event) {
        event.preventDefault();
        let valido = true;

        const nome = document.getElementById("nome");
        const email = document.getElementById("email");
        const messaggio = document.getElementById("messaggio");

        const erroreNome = document.getElementById("errore-nome");
        const erroreEmail = document.getElementById("errore-email");
        const erroreMessaggio = document.getElementById("errore-messaggio");

        erroreNome.textContent = "";
        erroreEmail.textContent = "";
        erroreMessaggio.textContent = "";

        if (nome.value.trim() === "") {
            erroreNome.textContent = "Inserisci il tuo nome.";
            valido = false;
        }
        if (!email.value.includes("@")) {
            erroreEmail.textContent = "Inserisci un'email valida.";
            valido = false;
        }
        if (messaggio.value.trim() === "") {
            erroreMessaggio.textContent = "Inserisci un messaggio.";
            valido = false;
        }

        if (valido) {
            form.reset();
            confermaMessaggio.classList.remove("hidden");
        }
    });
});

