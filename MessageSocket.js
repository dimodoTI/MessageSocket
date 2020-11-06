/** @format */

const fs = require("fs");
const https = require("https");
const http = require("http");
const WebSocket = require("ws");

const HOST = "host";
const CLIENT = "client";

const NEW_CONNECTION = "new";
const DO_ACTION = "do";

const server = https.createServer({
    key: fs.readFileSync("certs/ws.notificaciones.dimodo.ga/key.pem"),
    cert: fs.readFileSync("certs/ws.notificaciones.dimodo.ga/fullchain.pem"),
});

/* const server = http.createServer();
 */
const wssecure = new WebSocket.Server({
    server,
});

let host = {};
let clients = {};

wssecure.on("connection", (connection) => {
    connection.send("Conectado...");
    connection.on("open", (message) => {
        connection.send("open...");
    });
    connection.on("close", (message) => {
        console.log("close...");
    });
    connection.on("message", (message) => {
        let data;

        try {
            data = JSON.parse(message);
        } catch (e) {
            console.log("Invalid JSON");
            data = {};
        }

        //switching type of the user message
        switch (data.type) {
            //when a user tries to login
            case NEW_CONNECTION:
                if (data.id && data.rol) {
                    console.log(NEW_CONNECTION, data);

                    if (data.rol == CLIENT) {
                        clients[data.id] = connection;
                    }
                    if (data.rol == HOST) {
                        host = connection;
                    }
                    connection.___identificador_rol = data.rol;
                    connection.___identificador_id = data.id;
                }
                break;
            case DO_ACTION:
                if (data.action) {
                    console.log(DO_ACTION, data);
                    broadcastToAllClients(data.action);
                }
                break;
            default:
                sendTo(connection, {
                    type: "error",
                    message: "Command not found: " + data.type,
                });
                break;
        }
    });
    connection.on("close", () => {
        if (connection.___identificador_rol == CLIENT) {
            delete clients[connection.___identificador_id];
            console.log(connection.___identificador_id, " exit");
        }
        if (connection.___identificador_rol == HOST) {
            host = {};
            console.log("Host exit");
        }
    });
});

const broadcastToAllClients = (action) => {
    for (const [key, value] of Object.entries(clients)) {
        sendTo(value, {
            type: DO_ACTION,
            action: action,
        });
        console.log(`Send To :${key}`);
    }
};

const sendTo = (connection, message) => {
    connection.send(JSON.stringify(message));
};

server.listen(9099, "0.0.0.0");
