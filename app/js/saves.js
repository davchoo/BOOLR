const fs = require("fs");
const savesFolder = "../saves/";

let saves = [];

let openedSaveFile;

// Read save files from "saves" folder
function readSaveFiles() {
    const updatedSaves = [];
    const files = fs.readdirSync(savesFolder);

    files.forEach(file => {
        const found = saves.find(save => save.fileName == file);
        if(found) return updatedSaves.push(found);

        updatedSaves.push({
            name: JSON.parse(fs.readFileSync(savesFolder + file, "utf-8")).name || file,
            fileSize: fs.statSync(savesFolder + file).size,
            fileName: file,
            location: savesFolder + file
        });
    });

    saves = updatedSaves;
}

function clearBoard() {
    zoom = zoomAnimation = 100;
    offset = { x: 0, y: 0 };
    variables = [];
    path = [];

    chat.hide();
    boolrConsole.hide();
    contextMenu.hide();
    waypointsMenu.hide();
    hoverBalloon.hide();
    customComponentToolbar.hide();
    dialog.hide();
    notifications.innerHTML = "";

    components = [];
    wires = [];

    redoStack = [];
    undoStack = [];
}

function save() {
    
}

function openSaveFile(save) {
    const saveFile = JSON.parse(fs.readFileSync(savesFolder + save.fileName, "utf-8"));
    if(!Array.isArray(saveFile)) {
        clearBoard();

        offset.x = saveFile.offset.x;
        offset.y = saveFile.offset.y;
        zoom = zoomAnimation = saveFile.zoom;

        const parsed = parse(saveFile.data);

        addSelection(
            parsed.components,
            parsed.wires
        );
    } else {
        clearBoard();

        const parsed = parse(saveFile);

        addSelection(
            parsed.components,
            parsed.wires
        );
    }

    openedSaveFile = save;
}

function createFileName(name) {
    name = name.replace(".board", "");
    name = name.replace(/[^a-z0-9|.]+/gi, '-').toLowerCase() || "new-board";

    let i = 0;
    while(fs.readdirSync(savesFolder).includes(name + (i > 0 ? ` (${i})`: '') + ".board")) ++i;
    if(i > 0) name += " (" + i + ")";

    name += ".board";

    return name;
}

function createSaveFile(name) {
    // Create safe file name
    const filename = createFileName(name);

    const save = {};
    save.name = name;

    save.offset = offset;
    save.zoom = zoom;

    save.data = stringify(components,wires);

    fs.writeFileSync(
        savesFolder + filename,
        JSON.stringify(save),
        "utf-8"
    );

    saves.push({
        name,
        fileSize: fs.statSync(savesFolder + filename).size,
        fileName: filename,
        location: savesFolder + filename
    });

    openedSaveFile = saves.slice(-1)[0];
}

function save() {
    const save = {};
    save.name = openedSaveFile.name;

    save.offset = offset;
    save.zoom = zoom;

    save.data = stringify(components,wires);

    fs.writeFile(
        savesFolder + openedSaveFile.fileName,
        JSON.stringify(save),
        "utf-8",
        (err,data) => err && console.log(err)
    );
}