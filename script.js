import { supabaseClient } from "./supabase.js";

const createForm = document.getElementById("createForm");
const urlInput = document.getElementById("urlInput");
const createdResult = document.getElementById("createdResult");
const urlList = document.getElementById("urlList");
const refreshButton = document.getElementById("refreshButton");

function gerarString(tamanho = 6) {
    const caracteres =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let resultado = "";

    for (let i = 0; i < tamanho; i++)
        resultado += caracteres[Math.floor(Math.random() * caracteres.length)];

    return resultado;
}

async function getURL(string) {
    const { data, error } = await supabaseClient
        .from("urls")
        .select("*")
        .eq("string", string)
        .maybeSingle();

    if (error) {
        console.error(error);
        return null;
    }

    return data;
}

async function createURL(url) {
    for (let i = 0; i < 5; i++) {
        const string = gerarString();

        const existente = await getURL(string);

        if (existente) continue;

        const { data, error } = await supabaseClient
            .from("urls")
            .insert({ url, string })
            .select()
            .single();

        if (!error) return data;

        if (error.code !== "23505") {
            console.error(error);
            return null;
        }
    }

    throw new Error("Não foi possível gerar um código único.");
}

async function sumURL(string) {
    const { data, error } = await supabaseClient
        .from("urls")
        .select("acessos")
        .eq("string", string)
        .single();

    if (error) {
        console.error(error);
        return;
    }

    const { error: updateError } = await supabaseClient
        .from("urls")
        .update({
            acessos: (data.acessos || 0) + 1
        })
        .eq("string", string);

    if (updateError)
        console.error(updateError);
}

async function listURLS() {
    urlList.innerHTML = `<p class="loading">Carregando...</p>`;

    const { data, error } = await supabaseClient
        .from("urls")
        .select("*")
        .order("id", { ascending: false });

    if (error) {
        console.error(error);
        urlList.innerHTML = `<p class="error">Erro ao carregar URLs.</p>`;
        return;
    }

    if (!data.length) {
        urlList.innerHTML = `<p class="empty">Nenhuma URL criada ainda.</p>`;
        return;
    }

    urlList.innerHTML = "";

    data.forEach(link => {
        const shortURL = `${location.origin}/?url=${link.string}`;

        const item = document.createElement("div");
        item.className = "urlItem";

        item.innerHTML = `
            <div class="urlOriginal">${link.url}</div>
            <div class="urlShort">${shortURL}</div>
            <div>Acessos: ${link.acessos}</div>

            <div class="urlActions">
                <button class="copyButton">Copiar</button>
                <button class="deleteButton">Excluir</button>
            </div>
        `;

        item.querySelector(".copyButton").onclick = async e => {
            await navigator.clipboard.writeText(shortURL);
            e.target.textContent = "Copiado!";

            setTimeout(() => {
                e.target.textContent = "Copiar";
            }, 1500);
        };

        item.querySelector(".deleteButton").onclick = () =>
            deleteURL(link.id);

        urlList.appendChild(item);
    });
}

async function deleteURL(id) {
    if (!confirm("Deseja realmente excluir esta URL?")) return;

    const { error } = await supabaseClient
        .from("urls")
        .delete()
        .eq("id", id);

    if (error) {
        console.error(error);
        alert("Erro ao excluir URL.");
        return;
    }

    listURLS();
}

createForm.addEventListener("submit", async e => {
    e.preventDefault();

    const url = urlInput.value.trim();

    createdResult.innerHTML = "<p>Criando...</p>";

    try {
        const data = await createURL(url);

        if (!data) throw new Error();

        const shortURL = `${location.origin}/?url=${data.string}`;

        createdResult.innerHTML = `
            <div class="success">
                <strong>URL criada!</strong>
                <br><br>
                <a href="${shortURL}" target="_blank">
                    ${shortURL}
                </a>
            </div>
        `;

        urlInput.value = "";
        listURLS();

    } catch (error) {
        console.error(error);

        createdResult.innerHTML = `
            <p class="error">Erro ao criar URL.</p>
        `;
    }
});

refreshButton.onclick = listURLS;


const codigo = new URLSearchParams(location.search).get("url");

if (codigo) {
    const data = await getURL(codigo);

    if (data) {
        await sumURL(codigo);
        location.replace(data.url);
    } else {
        document.body.innerHTML = `
            <h1>URL não encontrada</h1>
            <p>O código informado não existe.</p>
        `;
    }
}

window.getURL = getURL;
window.createURL = createURL;
window.listURLS = listURLS;
window.deleteURL = deleteURL;
window.gerarString = gerarString;

if (!codigo) listURLS();