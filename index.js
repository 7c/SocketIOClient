const chalk = require('chalk');
const { wait } = require('mybase');
const debug = require('debug')('_SocketIOClient')
const ioclient = require('socket.io-client');

class SocketIOClient {
    isReady = false
    socket = false

    log(...args) {
        console.log(chalk.bgBlue(`SocketIOClient(${this.options.name}):`), ...args)
    }

    waitReady(timeout = 3000) {
        let that = this
        return new Promise(async function (resolve,reject) {
            debug(`waitReady(${timeout})`)
            let started = Date.now()
            while (true) {
                if (that.isReady) return resolve(true)
                if (Date.now() - started > timeout) return reject('NOTREADY')
                await wait(1 / 100)
            }    
        })
    }

    async emitCB(timeout,...args) {
        if (typeof timeout!==`number`) throw new Error(`timeout must be a number`)
        debug(`emitCB(${timeout} ms timeout)`)
        let that = this
        return new Promise(async function (resolve, reject) {
            debug(`isReady: ${that.isReady}`)
            if (!that.isReady) await that.waitReady(timeout)

            // Create a timeout for the operation
            const timeoutId = setTimeout(() => { reject("TIMEDOUT")}, timeout);  

            that.socket.emit(...args, (...args2) => {
                clearTimeout(timeoutId)
                debug(`recevied`,args2)
                return resolve(args2)
            })
        })

    }

    constructor(serverURL, serverOptions = {}, options = {}) {
        let defaultOptions = {
            name: 'client',
            transports: ['websocket'],
            upgrade: false,
            rejectUnauthorized: false,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            // reconnectionAttempts: 5,
            timeout: 20000,
            pingInterval: 10000,
            pingTimeout: 5000,
            autoConnect: true,
            agent: false,
            path: '/socket.io',
        }
        serverOptions = Object.assign(defaultOptions, serverOptions)
        options = Object.assign({
            name: 'client',
            onConnect: false,
            onDisconnect: false
        }, options)
        this.serverOptions = serverOptions
        this.options = options
        // this.log(serverURL, serverOptions)
        this.socket = ioclient.connect(serverURL, serverOptions)

        this.socket.on("connect", (client) => {
            this.log(chalk.green(`connected`))
            if (this.options?.onConnect) this.options.onConnect(client)
            this.isReady = true
        })

        this.socket.on("disconnect", () => {
            this.log(chalk.red(`disconnected`))
            this.isReady = false
            if (this.options?.onDisconnect) this.options.onDisconnect(client)
        })

        this.socket.on("error", (error) => {
            this.log(chalk.red(`error`), error)
            // TODO
            // Error Handling: In the "error" event handler, you might also consider setting isReady = false, depending on whether 
            // you view an error as making the client "not ready". Errors may not always lead to disconnection, so you'll need to 
            // decide based on your specific use-case requirements.
            // Handle error based on its type or content


            if (error?.type === "TransportError") {
                // Handle transport error
            } else if (error?.message === "Unauthorized") {
                // Handle unauthorized error
            } else {
                // Generic error handling
            }

            // most of the errors are probably server-side so we can set isReady to false
            this.isReady = false;  // You can optionally set isReady to false here
        })

        this.socket.on("reconnecting", (attemptNumber) => {
            this.log(chalk.bold(`reconnecting #${attemptNumber}`))
        })

        this.socket.on("reconnect", () => {
            // this is fired when reconnection was successfull
            this.log(chalk.green(`reconnected`))
            this.isReady = true
        })
    }
}


module.exports = SocketIOClient