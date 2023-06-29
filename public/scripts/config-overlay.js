const mainHeaderElement = document.getElementById('main-header');

const configOverlayElement = document.getElementById('config-overlay');
const backdropElement = document.getElementById('backdrop');

const searchGroupBtn = document.getElementById('search-grp');
const cancelBtnOverlay = document.getElementById('cancel-btn');
const closeSvgBtn = document.getElementById('close-svg');

searchGroupBtn.addEventListener('click', openOverlay);
cancelBtnOverlay.addEventListener('click', closeOverlay);
closeSvgBtn.addEventListener('click', closeOverlay);
backdropElement.addEventListener('click', closeOverlay);

function openOverlay() {
    configOverlayElement.style.display = 'block';
    backdropElement.style.display = 'block';
    mainHeaderElement.style.backgroundColor = 'rgb(216, 215, 215)';
}

function closeOverlay() {
    configOverlayElement.style.display = 'none';
    backdropElement.style.display = 'none';
    mainHeaderElement.style.backgroundColor = 'rgb(243, 241, 241)';
}