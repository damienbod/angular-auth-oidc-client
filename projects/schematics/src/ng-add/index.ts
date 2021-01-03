import { chain, Rule } from '@angular-devkit/schematics';
import { getAllActions } from './actions';
import { Schema } from './schema';

export function ngAdd(options: Schema): Rule {
    const allActions = getAllActions(options);
    return chain(allActions);
}
