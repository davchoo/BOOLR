var socket;

function connectToSocket(url) {
    try {
        socket = new WebSocket(url);
    } catch(e) {
        return;
    }

    socket.onopen = function() {
        components = [];
        notifications.push("Connected to " + url);
    }

    socket.onclose = function() {
        notifications.push("Connection closed", "error");
        socket = null;
    }

    socket.onerror = function(err) {
        notifications.push("Connection error: " + err, "error");
        socket = null;
    }

    socket.onmessage = function(e) {
        const msg = JSON.parse(e.data);

        switch(msg.type) {
            case "loginRequest":
                popup.login.show();
                break;
            case "users":
                const userData = JSON.parse(msg.data);
                socket.userName = userData.you;
                socket.users = userData.users;
                break;
            case "chat":
                notifications.push(`[${msg.data.from == socket.userName ? "You" : msg.data.from}] ` + `${msg.data.msg}`.fontcolor("#444"));
                break;
            case "notification":
                notifications.push(msg.data);
                break;
            case "map":
                const parsed = parse(msg.data) || [];
                for(let i = 0, len = parsed.length; i < len; ++i) {
                    if(parsed[i].constructor == Wire) {
                        components.unshift(parsed[i]);
                    } else {
                        components.push(parsed[i]);
                    }
                }
                break;
            case "action":
                const type = msg.data.type;
                const user = msg.data.from || true;

                let data = msg.data.socketData;
                if(type == "add") {
                    data = parse(data)[0];
                } else if(type == "connect") {
                    data[0] = components[+data[0].substr(2)];
                    data[1] = components[+data[1].substr(2)];
                    data[2] = parse(data[2])[0];
                } else if(Array.isArray(data)) {
                    data = data.map(n => n.toString().substr(0,2) == "i#" ? components[+n.substr(2)] : n);
                } else {
                    data = data.toString().substr(0,2) == "i#" ? components[+data.substr(2)] : data;
                }

                console.log(type,data);

                action(type,data,false,user);
                break;
        }
    }
}