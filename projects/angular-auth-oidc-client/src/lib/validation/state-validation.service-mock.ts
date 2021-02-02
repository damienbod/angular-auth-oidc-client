import { CallbackContext } from '../flows/callback-context';

export class StateValidationServiceMock {
    getValidatedStateResult(callbackContext: CallbackContext) {
        return null;
    }

    validateState(callbackContext) {
        return null;
    }
}
