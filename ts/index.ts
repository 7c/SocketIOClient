import chalk from 'chalk';
import { wait } from 'mybase/ts';
import debug from 'debug';
import { io, Socket } from 'socket.io-client';
const dbg = debug('_SocketIOClient')

interface ServerOptions {
    name?: string;
    transports?: string[];
    upgrade?: boolean;
    rejectUnauthorized?: boolean;
    reconnection?: boolean;
    reconnectionDelay?: number;
    reconnectionDelayMax?: number;
    timeout?: number;
    pingInterval?: number;
    pingTimeout?: number;
    autoConnect?: boolean;
    agent?: boolean;
    path?: string;
}

interface Options {
    name?: string;
    onConnect?: () => void;
    onDisconnect?: () => void;
}

export class SocketIOClient {
    isReady = false;
    socket: Socket;
    serverOptions: ServerOptions;
    options: Options;

    log(...args: any[]) {
        console.log(chalk.bgBlue(`SocketIOClient(${this.options.name}):`), ...args);
    }

    waitReady(timeout = 3000) {
        let that = this;
        return new Promise<boolean>(async function (resolve, reject) {
            dbg(`waitReady(${timeout})`);
            let started = Date.now();
            while (true) {
                if (that.isReady) return resolve(true);
                if (Date.now() - started > timeout) return reject('NOTREADY');
                await wait(1 / 100);
            }
        });
    }

    async emitCB(timeout: number, endpoint: string,args: any[]) {
        if (typeof timeout !== `number`) throw new Error(`timeout must be a number`);
        dbg(`emitCB(${timeout}ms,${endpoint})`,args);
        let that = this;
        return new Promise<any[]>(async function (resolve, reject) {
            dbg(`isReady: ${that.isReady}`);
            if (!that.isReady) await that.waitReady(timeout);

            // Create a timeout for the operation
            const timeoutId = setTimeout(() => { reject("TIMEDOUT") }, timeout);
            that.socket.emit(endpoint, args,(...args2:any[]) =>{
                clearTimeout(timeoutId);
                dbg(`recevied`, args2);
                return resolve(args2);
            });
        });
    }

    constructor(serverURL: string, serverOptions: ServerOptions = {}, options: Options = {}) {
        let defaultOptions: ServerOptions = {
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
        this.serverOptions = { ...defaultOptions, ...serverOptions };
        this.options = { name: 'client', ...options };
        this.socket = io(serverURL, this.serverOptions);

        this.socket.on("connect", () => {
            this.log(chalk.green(`connected`));
            if (this.options?.onConnect) this.options.onConnect();
            this.isReady = true;
        });

        this.socket.on("disconnect", () => {
            this.log(chalk.red(`disconnected`));
            this.isReady = false;
            if (this.options?.onDisconnect) this.options.onDisconnect();
        });

        this.socket.on("error", (error) => {
            this.log(chalk.red(`error`), error);
            // Handle error based on its type or content
            if (error?.type === "TransportError") {
                // Handle transport error
            } else if (error?.message === "Unauthorized") {
                // Handle unauthorized error
            } else {
                // Generic error handling
            }
            this.isReady = false;  // You can optionally set isReady to false here
        });

        this.socket.on("reconnecting", (attemptNumber) => {
            this.log(chalk.bold(`reconnecting #${attemptNumber}`));
        });

        this.socket.on("reconnect", () => {
            this.log(chalk.green(`reconnected`));
            this.isReady = true;
        });
    }
}

export default SocketIOClient;