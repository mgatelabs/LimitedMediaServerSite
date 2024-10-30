import { AuthSession } from "./auth.service";

export class SessionInfo {

    constructor(public session: AuthSession) {

    }


    isFeatureEnabled(feature: number): boolean {
        return (this.session.features & feature) > 0;
    }
}
