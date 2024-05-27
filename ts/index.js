"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketIOClient = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ts_1 = require("mybase/ts");
const debug_1 = __importDefault(require("debug"));
const socket_io_client_1 = require("socket.io-client");
const dbg = (0, debug_1.default)('_SocketIOClient');
class SocketIOClient {
    log(...args) {
        console.log(chalk_1.default.bgBlue(`SocketIOClient(${this.options.name}):`), ...args);
    }
    waitReady(timeout = 3000) {
        let that = this;
        return new Promise(async function (resolve, reject) {
            dbg(`waitReady(${timeout})`);
            let started = Date.now();
            while (true) {
                if (that.isReady)
                    return resolve(true);
                if (Date.now() - started > timeout)
                    return reject('NOTREADY');
                await (0, ts_1.wait)(1 / 100);
            }
        });
    }
    async emitCB(timeout, endpoint, args) {
        if (typeof timeout !== `number`)
            throw new Error(`timeout must be a number`);
        dbg(`emitCB(${timeout}ms,${endpoint})`, args);
        let that = this;
        return new Promise(async function (resolve, reject) {
            dbg(`isReady: ${that.isReady}`);
            if (!that.isReady)
                await that.waitReady(timeout);
            // Create a timeout for the operation
            const timeoutId = setTimeout(() => { reject("TIMEDOUT"); }, timeout);
            that.socket.emit(endpoint, args, (...args2) => {
                clearTimeout(timeoutId);
                dbg(`recevied`, args2);
                return resolve(args2);
            });
        });
    }
    constructor(serverURL, serverOptions = {}, options = {}) {
        this.isReady = false;
        let defaultOptions = {
            name: 'client',
            transports: ['websocket'],
            upgrade: false,
            rejectUnauthorized: false,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            pingInterval: 10000,
            pingTimeout: 5000,
            autoConnect: true,
            agent: false,
            path: '/socket.io',
        };
        this.serverOptions = Object.assign(Object.assign({}, defaultOptions), serverOptions);
        this.options = Object.assign({ name: 'client' }, options);
        this.socket = (0, socket_io_client_1.io)(serverURL, this.serverOptions);
        this.socket.on("connect", () => {
            var _a;
            this.log(chalk_1.default.green(`connected`));
            if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.onConnect)
                this.options.onConnect();
            this.isReady = true;
        });
        this.socket.on("disconnect", () => {
            var _a;
            this.log(chalk_1.default.red(`disconnected`));
            this.isReady = false;
            if ((_a = this.options) === null || _a === void 0 ? void 0 : _a.onDisconnect)
                this.options.onDisconnect();
        });
        this.socket.on("error", (error) => {
            this.log(chalk_1.default.red(`error`), error);
            // Handle error based on its type or content
            if ((error === null || error === void 0 ? void 0 : error.type) === "TransportError") {
                // Handle transport error
            }
            else if ((error === null || error === void 0 ? void 0 : error.message) === "Unauthorized") {
                // Handle unauthorized error
            }
            else {
                // Generic error handling
            }
            this.isReady = false; // You can optionally set isReady to false here
        });
        this.socket.on("reconnecting", (attemptNumber) => {
            this.log(chalk_1.default.bold(`reconnecting #${attemptNumber}`));
        });
        this.socket.on("reconnect", () => {
            this.log(chalk_1.default.green(`reconnected`));
            this.isReady = true;
        });
    }
}
exports.SocketIOClient = SocketIOClient;
exports.default = SocketIOClient;
//# sourceMappingURL=index.js.map