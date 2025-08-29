// Funzione per aprire la lightbox
function apriLightbox(src, caption) {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const lightboxCaption = document.getElementById("lightbox-caption");

    lightbox.style.display = "flex";
    lightboxImg.src = src;
    lightboxCaption.textContent = caption;
}

// Funzione per chiudere la lightbox
function chiudiLightbox() {
    document.getElementById("lightbox").style.display = "none";
}