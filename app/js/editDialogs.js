// I'm sorry for the mess

(function() {
    function createInput(
        component,
        property,
        value,
        valid,
        errormsg,
        apply) {
        const input = document.createElement("input");
        input.value = value;

        input.valid = valid;
        input.errormsg = errormsg;
        input.apply = apply;

        dialog.container.appendChild(document.createTextNode(property.slice(0,1).toUpperCase() + property.slice(1) + ":"));
        dialog.container.appendChild(input);
        dialog.container.appendChild(document.createElement("br"));
        return input;
    }

    function createTextArea(
        component,
        property,
        value,
        valid,
        errormsg,
        apply) {
        const input = document.createElement("textarea");
        input.value = value;

        input.valid = valid;
        input.errormsg = errormsg;
        input.apply = apply;

        dialog.container.appendChild(document.createTextNode(property.slice(0,1).toUpperCase() + property.slice(1) + ":"));
        dialog.container.appendChild(input);
        dialog.container.appendChild(document.createElement("br"));
        return input;
    }

    function createSelect(
        component,
        property,
        value,
        options,
        apply) {
        const input = document.createElement("select");
        for (let i = 0; i < options.length; i++) {
            const option = document.createElement("option");
            option.value = options[i].value;
            if (option.value === value) {
                option.selected = true;
            }
            option.appendChild(document.createTextNode(options[i].text));
            input.appendChild(option);
        }
        input.valid = () => true;
        input.errormsg = "";
        input.apply = apply;

        dialog.container.appendChild(document.createTextNode(property.slice(0,1).toUpperCase() + property.slice(1) + ":"));
        dialog.container.appendChild(input);
        dialog.container.appendChild(document.createElement("br"));
        return input;
    }

    dialog.editComponent = function(component) {
        dialog.show();
        dialog.name.innerHTML = "Edit component";
        dialog.container.innerHTML += "<p class='material-icons' style='font-size: 60px; margin: 10px'>edit<p>";

        const name = createInput(
            component, "name", component.name,
            name => name.length > 0 && name.length < 12,
            "Enter a name between 0 and 12 characters",
            function() {
                edit(component,"name",this.value,true);
            }
        );
        setTimeout(() => name.focus(), 10);

        const pos = createInput(
            component, "pos", component.pos.x + "," + component.pos.y,
            pos => (pos.match(/-?\d+\s*\,\s*-?\d+/g) || [])[0] == pos,
            "Enter a value for x and y separated by a comma",
            function() {
                const pos = this.value.split(",").map(n => +n);
                component.pos.x = pos[0];
                component.pos.t = pos[1];
            }
        );
        const width = createInput(
            component, "width", component.width,
            width => width > 0 && 2 * (+width + component.height) >= component.input.length + component.output.length,
            "The component must be wider for the ports to fit",
            function() {
                changeSize(component,+this.value,undefined,true);
            }
        );
        const height = createInput(
            component, "height", component.height,
            height => {
                height = parseVariableInput(height);
                if(isNaN(height)) return false;
                return height > 0 && 2 * (+height + component.width) >= component.input.length + component.output.length
            },
            "The component must be higher for the ports to fit",
            function() {
                changeSize(component,undefined, parseVariableInput(+this.value), true);
            }
        );

        const inputs = [name,pos,width,height];

        // Additional properties:

        if(component.properties.hasOwnProperty("delay")) {
            inputs.push(
                createInput(
                    component.properties, "delay", component.properties.delay || "",
                    delay => !isNaN(parseVariableInput(delay)),
                    "Enter a positive delay time in milliseconds",
                    function() {
                        component.properties.delay = parseVariableInput(this.value);
                        createVariableReference(this.value,component,["properties","delay"]);
                    }
                )
            );
            dialog.container.removeChild(dialog.container.children[dialog.container.children.length - 1]);
            dialog.container.appendChild(document.createTextNode("ms"));
            dialog.container.appendChild(document.createElement("br"));
        }

        if(component.properties.hasOwnProperty("frequency")) {
            inputs.push(
                createInput(
                    component.properties, "frequency", component.properties.frequency,
                    frequency => +frequency > 0,
                    "Enter a positive frequency value in Hz",
                    function() {
                        component.properties.frequency = +this.value;
                    }
                )
            );
            dialog.container.removeChild(dialog.container.children[dialog.container.children.length - 1]);
            dialog.container.appendChild(document.createTextNode("Hz"));
            dialog.container.appendChild(document.createElement("br"));
        }

        if(component.properties.hasOwnProperty("duration")) {
            inputs.push(
                createInput(
                    component.properties, "duration", component.properties.duration,
                    frequency => +frequency > 0,
                    "Enter a positive duration time in ms",
                    function() {
                        component.properties.duration = +this.value;
                    }
                )
            );
            dialog.container.removeChild(dialog.container.children[dialog.container.children.length - 1]);
            dialog.container.appendChild(document.createTextNode("ms"));
            dialog.container.appendChild(document.createElement("br"));
        }

        if(component.properties.hasOwnProperty("data")) {
            inputs.push(
                createTextArea(
                    component.properties, "data", component.properties.data,
                    function(value) {
                        let re = /^[0-9A-Fa-f]+$/g;
                        return re.test(value);
                    },
                    "Enter hex-encoded data",
                    function() {
                        component.updateData(this.value);
                    }
                )
            );
            dialog.container.removeChild(dialog.container.children[dialog.container.children.length - 1]);
            dialog.container.appendChild(document.createElement("br"));
        }

        const errormsg = document.createElement("p");
        errormsg.className = "errormsg";
        errormsg.innerHTML = ".";
        errormsg.hide = null;
        errormsg.show = function(text) {
            clearTimeout(this.hide);
            this.innerHTML = text;
            this.style.opacity = 1;
            this.hide = setTimeout(() => this.style.opacity = 0, 2500);
        }
        dialog.container.appendChild(errormsg);

        dialog.addOption("Cancel");
        dialog.addOption("OK",  function() {
            for(let i = 0; i < inputs.length; ++i) {
                const input = inputs[i];
                input.className = "";

                if(!input.valid(input.value)) {
                    input.className = "error";
                    errormsg.show(input.errormsg);

                    this.onmouseup = () => this.onmouseup = dialog.hide;
                    return;
                }
            }

            for(let i = 0; i < inputs.length; ++i) {
                inputs[i].apply();
            }
        });
    }

    dialog.editPort = function(port) {
        dialog.show();
        dialog.name.innerHTML = "Edit port";
        dialog.container.innerHTML += "<p class='material-icons' style='font-size: 60px; margin: 10px'>edit<p>";

        const name = createInput(
            port, "name", port.name || "",
            name => name.length < 12,
            "Enter a name between 0 and 12 characters",
            function() {
                edit(port,"name",this.value);
            }
        );
        setTimeout(() => name.focus(), 10);

        const side = createInput(
            port.pos, "side", port.pos.side,
            side => +side >= 0 && +side <= 3,
            "Enter the number of a side, a number between 0 and 3",
            function() {
                movePort(port,+this.value,port.pos.pos);
            }
        );

        const pos = createInput(
            port.pos, "pos", port.pos.pos,
            pos => side.valid(side.value) && +pos >= 0 && +pos < (+side.value % 2 == 0 ? port.component.width: port.component.height) && !findPortByComponent(port.component,+side.value,+pos),
            "Enter a (free) position for the port, a number between 0 and the width/height of the component",
            function() {
                movePort(port,port.pos.side,+this.value);
            }
        );

        const inputs = [name,side,pos];

        const errormsg = document.createElement("p");
        errormsg.className = "errormsg";
        errormsg.innerHTML = ".";
        errormsg.hide = null;
        errormsg.show = function(text) {
            clearTimeout(this.hide);
            this.innerHTML = text;
            this.style.opacity = 1;
            this.hide = setTimeout(() => this.style.opacity = 0, 2500);
        }
        dialog.container.appendChild(errormsg);

        dialog.addOption("Cancel");
        dialog.addOption("OK",  function() {
            for(let i = 0; i < inputs.length; ++i) {
                const input = inputs[i];
                input.className = "";

                if(!input.valid(input.value)) {
                    input.className = "error";
                    errormsg.show(input.errormsg);

                    this.onmouseup = () => this.onmouseup = dialog.hide;
                    return;
                }
            }

            for(let i = 0; i < inputs.length; ++i) {
                inputs[i].apply();
            }
        });
    }

    dialog.editDelay = function(component,callback) {
        if(!component) return;
        dialog.show();
        dialog.name.innerHTML = "Edit delay";
        dialog.container.innerHTML += "<i class='material-icons' style='font-size: 60px'>access_time<i>";
        dialog.container.innerHTML += `<p>Enter a delay time in ms for component <i>${component.name}</i></p>`;

        const input = createInput(
            component.properties, "delay", component.properties.delay || "",
            delay => !isNaN(parseVariableInput(delay)),
            "Enter a positive delay time in milliseconds",
            function() {
                component.properties.delay = parseVariableInput(this.value);
                createVariableReference(this.value,component,["properties","delay"]);
            }
        );
        setTimeout(() => input.focus(),10);
        dialog.container.removeChild(dialog.container.children[dialog.container.children.length - 1]);
        dialog.container.appendChild(document.createTextNode("ms"));

        const errormsg = document.createElement("p");
        errormsg.className = "errormsg";
        errormsg.innerHTML = ".";
        errormsg.hide = null;
        errormsg.show = function(text) {
            clearTimeout(this.hide);
            this.innerHTML = text;
            this.style.opacity = 1;
            this.hide = setTimeout(() => this.style.opacity = 0, 2500);
        }
        dialog.container.appendChild(errormsg);

        dialog.addOption("Cancel", function() {
            if(!component.properties.delay) {
                component.properties.delay = 1000;
                callback && callback();
            }
        });
        dialog.addOption("OK",  function() {
            if(input.valid(input.value)) {
                input.apply();
                callback && callback();
            } else {
                input.className = "error";
                errormsg.show(input.errormsg);
                this.onmouseup = () => this.onmouseup = dialog.hide;
            }
        });
    }
    dialog.editRom = function(component,callback) {
        if(!component) return;
        dialog.show();
        dialog.name.innerHTML = "Edit ROM";
        dialog.container.innerHTML += "<i class='material-icons' style='font-size: 60px'>memory<i>";
        dialog.container.innerHTML += `<p>Enter a hex-encoded data for component <i>${component.name}</i></p>`;

        const addressWidthInput = createInput(
            component.properties, "addressWidth", component.properties.addressWidth || "4",
            function(addressWidth) {
                let value = parseVariableInput(addressWidth)
                return !isNaN(value) && 1 <= value && value <= 24;
            },
            "Address width must be 1 <= x <= 24",
            function() {
                component.properties.addressWidth = parseVariableInput(this.value);
                createVariableReference(this.value,component,["properties","addressWidth"]);
            }
        );
        const dataWidthInput = createSelect(
            component.properties, "dataWidth", component.properties.dataWidth || 4,
            [{"value": 4, "text": "4"},
             {"value": 8, "text": "8"},
             {"value": 16, "text": "16"},
             {"value": 32, "text": "32"}],
            function() {
                component.properties.dataWidth = +this.value;
            }
        );
        const dataInput = createTextArea(
            component.properties, "data", component.properties.data || "",
            function(value) {
                let re = /^[0-9A-Fa-f]+$/g;
                return re.test(value);
            },
            "Enter hex-encoded data",
            function() {
                // Keep original data
                component.properties.data = this.value;
                createVariableReference(this.value,component,["properties","rom"]);
            }
        );
        setTimeout(() => addressWidthInput.focus(),10);
        dialog.container.removeChild(dialog.container.children[dialog.container.children.length - 1]);

        const errormsg = document.createElement("p");
        errormsg.className = "errormsg";
        errormsg.innerHTML = ".";
        errormsg.hide = null;
        errormsg.show = function(text) {
            clearTimeout(this.hide);
            this.innerHTML = text;
            this.style.opacity = 1;
            this.hide = setTimeout(() => this.style.opacity = 0, 2500);
        }
        dialog.container.appendChild(errormsg);

        dialog.addOption("Cancel", function() {
            if(!component.properties.addressWidth && !component.properties.data) {
                component.properties.addressWidth = 0;
                component.properties.data = "";
                callback && callback();
            }
        });
        dialog.addOption("OK",  function() {
            let addressWidthValid = addressWidthInput.valid(addressWidthInput.value);
            let dataWidthValid = dataWidthInput.valid(dataWidthInput.value);
            let dataValid = dataInput.valid(dataInput.value);
            if (addressWidthValid && dataWidthValid && dataValid) {
                addressWidthInput.apply();
                dataWidthInput.apply();
                dataInput.apply();
                callback && callback();
            } else {
                let error = "";
                if (!addressWidthValid) {
                    addressWidthInput.className = "error";
                    error += addressWidthInput.errormsg + "<br>";
                }
                if (!dataWidthValid) {
                    dataWidthInput.className = "error";
                    error += dataWidthInput.errormsg + "<br>";
                }
                if (!dataValid) {
                    dataInput.className = "error";
                    error += dataInput.errormsg;
                }
                errormsg.show(error);
                this.onmouseup = () => this.onmouseup = dialog.hide;
            }
        });
    }
    dialog.editRam = function(component,callback) {
        if(!component) return;
        dialog.show();
        dialog.name.innerHTML = "Edit RAM";
        dialog.container.innerHTML += "<i class='material-icons' style='font-size: 60px'>memory<i>";
        dialog.container.innerHTML += `<p>Enter widths for component <i>${component.name}</i></p>`;

        const addressWidthInput = createInput(
            component.properties, "addressWidth", component.properties.addressWidth || "4",
            function(addressWidth) {
                let value = parseVariableInput(addressWidth)
                return !isNaN(value) && 1 <= value && value <= 24;
            },
            "Address width must be 1 <= x <= 24",
            function() {
                component.properties.addressWidth = parseVariableInput(this.value);
                createVariableReference(this.value,component,["properties","addressWidth"]);
            }
        );
        const dataWidthInput = createSelect(
            component.properties, "dataWidth", component.properties.dataWidth || 4,
            [{"value": 4, "text": "4"},
             {"value": 8, "text": "8"},
             {"value": 16, "text": "16"},
             {"value": 32, "text": "32"}],
            function() {
                component.properties.dataWidth = +this.value;
            }
        );
        setTimeout(() => addressWidthInput.focus(),10);
        dialog.container.removeChild(dialog.container.children[dialog.container.children.length - 1]);

        const errormsg = document.createElement("p");
        errormsg.className = "errormsg";
        errormsg.innerHTML = ".";
        errormsg.hide = null;
        errormsg.show = function(text) {
            clearTimeout(this.hide);
            this.innerHTML = text;
            this.style.opacity = 1;
            this.hide = setTimeout(() => this.style.opacity = 0, 2500);
        }
        dialog.container.appendChild(errormsg);

        dialog.addOption("Cancel", function() {
            if(!component.properties.addressWidth && !component.properties.data) {
                component.properties.addressWidth = 0;
                callback && callback();
            }
        });
        dialog.addOption("OK",  function() {
            let addressWidthValid = addressWidthInput.valid(addressWidthInput.value);
            let dataWidthValid = dataWidthInput.valid(dataWidthInput.value);
            if (addressWidthValid && dataWidthValid) {
                addressWidthInput.apply();
                dataWidthInput.apply();
                callback && callback();
            } else {
                let error = "";
                if (!addressWidthValid) {
                    addressWidthInput.className = "error";
                    error += addressWidthInput.errormsg + "<br>";
                }
                if (!dataWidthValid) {
                    dataWidthInput.className = "error";
                    error += dataWidthInput.errormsg + "<br>";
                }
                errormsg.show(error);
                this.onmouseup = () => this.onmouseup = dialog.hide;
            }
        });
    }
    dialog.editMux = function(component,callback) {
        if(!component) return;
        dialog.show();
        dialog.name.innerHTML = "Edit MUX";
        dialog.container.innerHTML += "<i class='material-icons' style='font-size: 60px'>multiplexer<i>";
        dialog.container.innerHTML += `<p>Enter widths for component <i>${component.name}</i></p>`;

        const selectionWidthInput = createInput(
            component.properties, "selectionWidth", component.properties.selectionWidth || "4",
            function(selectionWidth) {
                let value = parseVariableInput(selectionWidth)
                let dataWidth = component.properties.dataWidth || "4";
                return !isNaN(value) && 1 <= value && value <= 24 && (dataWidth * Math.pow(2, selectionWidth)) <= 64;
            },
            "Selection width must be 1 <= x <= 24 and (data width * 2 ^ selection width) <= 64",
            function() {
                component.properties.selectionWidth = parseVariableInput(this.value);
                createVariableReference(this.value,component,["properties","selectionWidth"]);
            }
        );
        const dataWidthInput = createSelect(
            component.properties, "dataWidth", component.properties.dataWidth || 4,
            [{"value": 4, "text": "4"},
             {"value": 8, "text": "8"},
             {"value": 16, "text": "16"},
             {"value": 32, "text": "32"}],
            function() {
                component.properties.dataWidth = +this.value;
            }
        );
        setTimeout(() => selectionWidthInput.focus(),10);
        dialog.container.removeChild(dialog.container.children[dialog.container.children.length - 1]);

        const errormsg = document.createElement("p");
        errormsg.className = "errormsg";
        errormsg.innerHTML = ".";
        errormsg.hide = null;
        errormsg.show = function(text) {
            clearTimeout(this.hide);
            this.innerHTML = text;
            this.style.opacity = 1;
            this.hide = setTimeout(() => this.style.opacity = 0, 2500);
        }
        dialog.container.appendChild(errormsg);

        dialog.addOption("Cancel", function() {
            if(!component.properties.selectionWidth && !component.properties.data) {
                component.properties.selectionWidth = 0;
                callback && callback();
            }
        });
        dialog.addOption("OK",  function() {
            let selectionWidthValid = selectionWidthInput.valid(selectionWidthInput.value);
            let dataWidthValid = dataWidthInput.valid(dataWidthInput.value);
            if (selectionWidthValid && dataWidthValid) {
                selectionWidthInput.apply();
                dataWidthInput.apply();
                callback && callback();
            } else {
                let error = "";
                if (!selectionWidthValid) {
                    selectionWidthInput.className = "error";
                    error += selectionWidthInput.errormsg + "<br>";
                }
                if (!dataWidthValid) {
                    dataWidthInput.className = "error";
                    error += dataWidthInput.errormsg + "<br>";
                }
                errormsg.show(error);
                this.onmouseup = () => this.onmouseup = dialog.hide;
            }
        });
    }
    dialog.editDemux = function(component,callback) {
        if(!component) return;
        dialog.show();
        dialog.name.innerHTML = "Edit DEMUX";
        dialog.container.innerHTML += "<i class='material-icons' style='font-size: 60px'>demultiplexer<i>";
        dialog.container.innerHTML += `<p>Enter widths for component <i>${component.name}</i></p>`;

        const selectionWidthInput = createInput(
            component.properties, "selectionWidth", component.properties.selectionWidth || "4",
            function(selectionWidth) {
                let value = parseVariableInput(selectionWidth)
                let dataWidth = component.properties.dataWidth || "4";
                return !isNaN(value) && 1 <= value && value <= 24 && (dataWidth * Math.pow(2, selectionWidth)) <= 64;
            },
            "Selection width must be 1 <= x <= 24 and (data width * 2 ^ selection width) <= 64",
            function() {
                component.properties.selectionWidth = parseVariableInput(this.value);
                createVariableReference(this.value,component,["properties","selectionWidth"]);
            }
        );
        const dataWidthInput = createSelect(
            component.properties, "dataWidth", component.properties.dataWidth || 4,
            [{"value": 4, "text": "4"},
             {"value": 8, "text": "8"},
             {"value": 16, "text": "16"},
             {"value": 32, "text": "32"}],
            function() {
                component.properties.dataWidth = +this.value;
            }
        );
        setTimeout(() => selectionWidthInput.focus(),10);
        dialog.container.removeChild(dialog.container.children[dialog.container.children.length - 1]);

        const errormsg = document.createElement("p");
        errormsg.className = "errormsg";
        errormsg.innerHTML = ".";
        errormsg.hide = null;
        errormsg.show = function(text) {
            clearTimeout(this.hide);
            this.innerHTML = text;
            this.style.opacity = 1;
            this.hide = setTimeout(() => this.style.opacity = 0, 2500);
        }
        dialog.container.appendChild(errormsg);

        dialog.addOption("Cancel", function() {
            if(!component.properties.selectionWidth && !component.properties.data) {
                component.properties.selectionWidth = 0;
                callback && callback();
            }
        });
        dialog.addOption("OK",  function() {
            let selectionWidthValid = selectionWidthInput.valid(selectionWidthInput.value);
            let dataWidthValid = dataWidthInput.valid(dataWidthInput.value);
            if (selectionWidthValid && dataWidthValid) {
                selectionWidthInput.apply();
                dataWidthInput.apply();
                callback && callback();
            } else {
                let error = "";
                if (!selectionWidthValid) {
                    selectionWidthInput.className = "error";
                    error += selectionWidthInput.errormsg + "<br>";
                }
                if (!dataWidthValid) {
                    dataWidthInput.className = "error";
                    error += dataWidthInput.errormsg + "<br>";
                }
                errormsg.show(error);
                this.onmouseup = () => this.onmouseup = dialog.hide;
            }
        });
    }
})();
