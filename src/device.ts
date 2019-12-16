import { EventEmitter } from "events";
import { Hub } from "./hub";

import * as Consts from "./consts";

export class Device extends EventEmitter {

    public autoSubscribe: boolean = true;

    protected _mode: number | undefined;
    protected _busy: boolean = false;
    protected _finished: (() => void) | undefined;

    private _hub: Hub;
    private _portId: number;
    private _connected: boolean = true;
    private _type: Consts.DeviceType;

    constructor (hub: Hub, portId: number, type: Consts.DeviceType = Consts.DeviceType.UNKNOWN) {
        super();
        this._hub = hub;
        this._portId = portId;
        this._type = type;
        const detachListener = (device: Device) => {
            if (device.portId === this.portId) {
                this._connected = false;
                this.hub.removeListener("detach", detachListener);
                this.emit("detach");
            }
        };
        this.hub.on("detach", detachListener);
    }

    public get connected () {
        return this._connected;
    }

    public get hub () {
        return this._hub;
    }

    public get portId () {
        return this._portId;
    }

    public get port () {
        return this.hub.getPortNameForPortId(this.portId);
    }

    public get type () {
        return this._type;
    }

    public send (data: Buffer, characteristic: string = Consts.BLECharacteristic.LPF2_ALL, callback?: () => void) {
        this._ensureConnected();
        this.hub.send(data, characteristic, callback);
    }

    public subscribe (mode: number) {
        this._ensureConnected();
        if (mode !== this._mode) {
            this._mode = mode;
            this.hub.subscribe(this.portId, mode);
        }
    }

    public receive (message: Buffer) {
        this.emit("receive", message);
    }

    public finish () {
        this._busy = false;
        if (this._finished) {
            this._finished();
            this._finished = undefined;
        }
    }

    private _ensureConnected () {
        if (!this.connected) {
            throw new Error("Device is not connected");
        }
    }

}