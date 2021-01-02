import { chain, Rule } from '@angular-devkit/schematics';
import { getAllActions } from './actions';

export function ngAdd(options: any): Rule {
    const allActions = getAllActions(options);
    return chain(allActions);
}
