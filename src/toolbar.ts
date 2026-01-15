import gsap from "gsap";

var isSelected: boolean = false;
var isOpen: boolean = true;
var offsetX: number = 0;
var offsetY: number = 0;

async function isDraggingToolbar(): Promise<boolean> {
    return isSelected;
}

async function selectToolbar(x: number, y: number, target: HTMLElement | null = null) {
    console.log("selected toolbar")
    if(!target) return;
    if(!target.closest("#drag-region")) return;

    const toolbar = document.getElementById("toolbar") as HTMLDivElement;

    // save offset x and y
    offsetX = x - toolbar.getBoundingClientRect().x;
    offsetY = y - toolbar.getBoundingClientRect().y;

    isSelected = true;
}

async function moveToolbar(x: number, y: number) {
    if(!isSelected) return;

    const toolbar = document.getElementById("toolbar") as HTMLDivElement;

    toolbar.style.left = `${x - offsetX}px`;
    toolbar.style.top = `${y - offsetY}px`;
}

async function releaseToolbar() {
    isSelected = false;
}

async function toggleToolbarIcon() {
    const icon = document.getElementById("open-toolbox-svg") as unknown as SVGElement;

    if(isOpen) {
        icon.setAttribute("viewBox", "0 0 448 512");
        icon.innerHTML = `<path d="M50.7 58.5L0 160l208 0 0-128L93.7 32C75.5 32 58.9 42.3 50.7 58.5zM240 160l208 0L397.3 58.5C389.1 42.3 372.5 32 354.3 32L240 32l0 128zm208 32L0 192 0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-224z"/>`;
        isOpen = false;
    } else {
        icon.setAttribute("viewBox", "0 0 640 512");
        icon.innerHTML = `<path d="M58.9 42.1c3-6.1 9.6-9.6 16.3-8.7L320 64 564.8 33.4c6.7-.8 13.3 2.7 16.3 8.7l41.7 83.4c9 17.9-.6 39.6-19.8 45.1L439.6 217.3c-13.9 4-28.8-1.9-36.2-14.3L320 64 236.6 203c-7.4 12.4-22.3 18.3-36.2 14.3L37.1 170.6c-19.3-5.5-28.8-27.2-19.8-45.1L58.9 42.1zM321.1 128l54.9 91.4c14.9 24.8 44.6 36.6 72.5 28.6L576 211.6l0 167c0 22-15 41.2-36.4 46.6l-204.1 51c-10.2 2.6-20.9 2.6-31 0l-204.1-51C79 419.7 64 400.5 64 378.5l0-167L191.6 248c27.8 8 57.6-3.8 72.5-28.6L318.9 128l2.2 0z"/>`
        isOpen = true;
    }
}

async function toggleToolbar() {
    const toolbox = document.getElementById("toolbar") as HTMLDivElement;

    const tl = gsap.timeline();

    if(toolbox.style.height === "37px") {
        tl.to(toolbox, {height: "250px", ease: "elastic.out(0.6, 0.3)", duration: 1});
        tl.to("#open-toolbox", {y: 5, duration: 0.25}, "<");
        tl.call(() => {
            toggleToolbarIcon();
        }, [], "<");
        tl.to("#open-toolbox", {y: 0, duration: 0.25, ease: "power3.out"}, "<+=0.25");
    } else if(toolbox.style.height === "250px" || toolbox.style.height === "") { // close but also prevent spamming
        tl.to(toolbox, {height: "37px", ease: "elastic.out(0.6, 0.3)", duration: 1});
        tl.to("#open-toolbox", {y: -5, duration: 0.25}, "<");
        tl.call(() => {
            toggleToolbarIcon();
        }, [], "<");
        tl.to("#open-toolbox", {y: 0, duration: 0.25, ease: "power3.out"}, "<+=0.25");
    }
}

export { selectToolbar, moveToolbar, releaseToolbar, isDraggingToolbar, toggleToolbar };