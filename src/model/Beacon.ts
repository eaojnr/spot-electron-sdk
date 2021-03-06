export const PROXIMITY = {
    IMMEDIATE: 'immediate',
    NEAR: 'near',
    FAR: 'far',
    UNKNOWN: 'unknown'
};

/**
 * Class represents a Beacon we work with.
 */
export default class Beacon {
    /**
     * The calculated distance of the device in meters.
     */
    distance: number;

    /**
     * The join code transmitted via major and minor version bytes.
     */
    joinCode: string;

    /**
     * UNIX timestamp of the last detection of the device.
     */
    lastSeen: number;

    /**
     * The string representation of the proximity of the device, based on the distance.
     */
    proximity: string;

    /**
     * The beacon uuid of the device.
     */
    uuid: string;

    /**
     * Instantiates a new Beacon object.
     *
     * @param uuid - The beacon uuid of the device.
     * @param joinCode - The join code transmitted via major and minor version bytes.
     * @param distance - The calculated distance of the device in meters.
     * @param proximity - The string representation of the proximity of the device, based on the distance.
     */
    constructor(uuid: string, joinCode: string, distance: number, proximity: string) {
        this.uuid = uuid;
        this.joinCode = joinCode;
        this.distance = distance;
        this.proximity = proximity;
        this.lastSeen = Date.now();
    }

    /**
     * Returns a distance rounded to .1 metres.
     */
    public getRoundedDistance(): number {
        return Math.round(this.distance * 10) / 10;
    }

    /**
     * Returns true if the two beacons are equal using a lenient comparison.
     *
     * @param b - The other Beacon object.
     */
    public isEqual(b: Beacon): boolean {
        return b
            && b.uuid === this.uuid
            && b.joinCode === this.joinCode
            && b.getRoundedDistance() === this.getRoundedDistance()
    }

    /**
     * Returns a string representation of the device. Used for debugging and logging purposes.
     */
    public toString(): string {
        return `UUID: ${this.uuid} CODE: ${this.joinCode} PROXIMITY: ${this.proximity}`;
    }

    /**
     * Static factory function to parse a raw device into a Spot Beacon, or return null if it's not a compatible device.
     *
     * @param dataString - The raw hex data of the detected device.
     */
    public static parse(dataString: string, rssi: number): Beacon | null {
        // data structure:
        // < 8 bytes  manufacturer string >
        // < 32 bytes UUID >
        // < 4 bytes major version >
        // < 4 bytes minor version >
        // < 2 bytes transmit power >
        const uuid = `${dataString.substr(0, 8)}-${dataString.substr(8, 4)}-${
            dataString.substr(12, 4)}-${dataString.substr(16, 4)}-${dataString.substr(20, 12)}`;
        const major = dataString.substr(32, 4);
        const minor = dataString.substr(36, 4);

        // Join code is stored with base 36 to base 16 transformation, so needs to be reverse-transformed
        const joinCode = parseInt(`${major}${minor}`, 16).toString(36);
        const power = parseInt(dataString.substr(40, 2), 16) - 256;

        // Based on https://www.rn.inf.tu-dresden.de/dargie/papers/icwcuca.pdf
        const distance = Math.pow(10, (power - rssi) / (10 * 2));

        let proximity: string;

        if (distance < 1) {
            proximity = PROXIMITY.IMMEDIATE;
        } else if (distance < 3) {
            proximity = PROXIMITY.NEAR;
        } else {
            proximity = PROXIMITY.FAR;
        }

        return new Beacon(uuid, joinCode, distance, proximity);
    }
}
