import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';

// Just return the tree
export function ngAdd(options: any): Rule {
    return (tree: Tree, context: SchematicContext) => {
        tree.create('hello.txt', 'Hello World!');
        // context.addTask(new NodePackageInstallTask());
        return tree;
    };
}
