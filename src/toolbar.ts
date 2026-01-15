var isSelected: boolean = false;
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

export { selectToolbar, moveToolbar, releaseToolbar, isDraggingToolbar };