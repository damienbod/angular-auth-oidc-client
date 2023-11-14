import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { getAllActions } from './actions';
import { Schema } from './schema';

export function ngAdd(options: Schema): Rule {
   return async (host: Tree, context: SchematicContext) => {
    const allActions = await getAllActions(host, options);
    return chain(allActions);
  }
}
