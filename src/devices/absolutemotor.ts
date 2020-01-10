import { TachoMotor } from "./tachomotor";

import { IDeviceInterface } from "../interfaces";

import * as Consts from "../consts";
import { mapSpeed } from "../utils";

export class AbsoluteMotor extends TachoMotor {

    constructor (hub: IDeviceInterface, portId: number, modeMap: {[event: string]: number} = {}, type: Consts.DeviceType = Consts.DeviceType.UNKNOWN) {
        super(hub, portId, Object.assign({}, modeMap, ModeMap), type);
    }

    public receive (message: Buffer) {
        const mode = this._mode;

        switch (mode) {
            case Mode.ABSOLUTE:
                // const absolute = message.readInt32LE(this.isWeDo2SmartHub ? 2 : 4);
                // /**
                //  * Emits when a the motors absolute position is changed.
                //  * @event AbsoluteMotor#absolute
                //  * @param {number} absolute
                //  */
                // this.emitGlobal("absolute", { absolute });
                break;
            default:
                super.receive(message);
                break;
        }
    }

    /**
     * Rotate a motor by a given angle.
     * @method AbsoluteMotor#gotoAbsolutePosition
     * @param {number} position Absolute position the motor should go to (degrees from 0).
     * @param {number} [speed=100] For forward, a value between 1 - 100 should be set. For reverse, a value between -1 to -100.
     * @returns {Promise} Resolved upon successful completion of command (ie. once the motor is finished).
     */
    public gotoAbsolutePosition (position: [number, number] | number, speed: number = 100) {
        if (!this.isVirtualPort && position instanceof Array) {
            throw new Error("Only virtual ports can accept multiple positions");
        }
        if (this.isWeDo2SmartHub) {
            throw new Error("Absolute positioning is not available on the WeDo 2.0 Smart Hub");
        }
        return new Promise((resolve) => {
            this._busy = true;
            if (speed === undefined || speed === null) {
                speed = 100;
            }
            let message;
            if (position instanceof Array) {
                message = Buffer.from([0x81, this.portId, 0x11, 0x0e, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, mapSpeed(speed), 0x64, 0x7f, 0x03]);
                message.writeUInt32LE(position[0], 4);
                message.writeUInt32LE(position[1], 8);
            } else {
                message = Buffer.from([0x81, this.portId, 0x11, 0x0d, 0x00, 0x00, 0x00, 0x00, mapSpeed(speed), 0x64, 0x7f, 0x03]);
                message.writeUInt32LE(position, 4);
            }
            this.send(message);
            this._finished = () => {
                return resolve();
            };
        });
    }

    /**
     * (Re)set the knowledge of the absolute position to the current position.
     * @method AbsoluteMotor#resetAbsolutePosition
     * @param {number} position Position to set (degrees from 0).
     * @returns {Promise} Resolved upon successful completion of command (ie. once the motor is finished).
     */
    public resetAbsolutePosition (position: [number, number] | number) {
        if (!this.isVirtualPort && position instanceof Array) {
            throw new Error("Only virtual ports can accept multiple positions");
        }
        if (this.isWeDo2SmartHub) {
            throw new Error("Absolute positioning is not available on the WeDo 2.0 Smart Hub");
        }
        return new Promise((resolve) => {
            this._busy = true;
            let message;
            if (position instanceof Array) {
                message = Buffer.from([0x81, this.portId, 0x11, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
                message.writeUInt32LE(position[0], 4);
                message.writeUInt32LE(position[0], 8);
            } else {
                message = Buffer.from([0x81, this.portId, 0x11, 0x51, 0x02, 0x00, 0x00, 0x00, 0x00]);
                message.writeUInt32LE(position, 5);
            }
            this.send(message);
            this._finished = () => {
                return resolve();
            };
        });
    }

}

export enum Mode {
    ROTATION = 0x02,
    ABSOLUTE = 0x03
}

export const ModeMap: {[event: string]: number} = {
    "rotate": Mode.ROTATION,
    "absolute": Mode.ABSOLUTE
};
