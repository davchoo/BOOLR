function select(Component) {
    Selected = Component;
    toolbar.message(`Selected ${Component.name} ${"gate"}`);
    hideLists();
}

const toolbar = document.getElementById("toolbar");
let hideToolbarMessage;
toolbar.message = function(msg,type) {
    clearTimeout(hideToolbarMessage);

    const toast = document.getElementById("toast");
    toast.style.display = "block";
    toast.innerHTML = msg;
    if(type == "warning") {
        toast.innerHTML = "<span class='material-icons' style='opacity: .5'>warning</span>" + toast.innerHTML;
    } else if(type == "action") {
        toast.innerHTML += "<button onclick='undo()' style='font-family: Ubuntu'><span class='material-icons'>undo</span>Undo</button>";
    }

    toast.style.marginLeft = -toast.clientWidth / 2 + "px";
    toast.style.opacity = 1;
    hideToolbarMessage = setTimeout(() => {
        toast.style.opacity = 0;
    },3000);
}

const listButtons = document.querySelectorAll(".slot[data-list]");
const lists = {};

function isListsHidden() {
    for (let id in lists) {
        if (lists[id].style.display != "none") {
            return false;
        }
    }
    return true;
}

function hideLists() {
    for (let id in lists) {
        if (lists[id].style.display != "none") {
            lists[id].hide();
        }
    }
}

for (let i = 0; i < listButtons.length;i++) {
    let listButton = listButtons[i];
    let list = document.getElementById(listButton.dataset.list);

    if (!list) continue;

    lists[list.id] = list;

    let yOff = i == 0 ? 150 : 75;
    list.style.transform = `scale(.5) translateX(-63px) translateY(${yOff}px)`;

    list.show = function() {
        list.style.display = "block";
        setTimeout(() => {
            list.style.opacity = 1;
            list.style.transform = "scale(1)";
        }, 1);
    }

    list.hide = function() {
        list.style.opacity = 0;
        list.style.transform = `scale(.5) translateX(-63px) translateY(${yOff}px)`;
        c.focus();
        setTimeout(() => list.style.display = "none", 200);
    }
    
    listButton.onmousedown = function() {
        document.getElementById("toolbartip").style.display = "none";
        if(list.style.display == "none") {
            hideLists();
            list.show();
        } else {
            list.hide();
        }
    }

    listButton.onmouseup = function() {
        listButton.focus();
    }
    
    list.onblur = function() {
        list.hide();
    }
    
    const listItems = list.children;
    for(let i = 0; i < listItems.length; ++i) {
        listItems[i].onmouseenter = function() { this.style.background = "#222" };
        listItems[i].onmouseleave = function() { this.style.background = "#111" };
        listItems[i].onmouseup = function() { this.onclick() };
    }
    
}
