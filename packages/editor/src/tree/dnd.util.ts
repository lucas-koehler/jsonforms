import { JsonSchema, update } from '@jsonforms/core';
import * as _ from 'lodash';

export const Types = {
    TREE_DND: 'tree-master-detail-DnD'
};

export const CSS = {
    DND_VALID_TARGET: 'jsf-editor-dnd-target-valid',
    DND_INVALID_TARGET: 'jsf-editor-dnd-target-invalid',
    DND_CURRENT_TARGET: 'jsf-editor-dnd-current-target'
};

/**
 * Information about a currently dragged data object.
 */
export interface DragInfo {
    /** The path to the dragged data object */
    path: string;
    /** The JsonSchema defining the dragged data object */
    schema: JsonSchema;
    /** The data object itself */
    data: any;
}

export interface DropResult {
    /**
     * Whether the drop event was handled by a list.
     * If true, the dragged item was already moved to its target location
     * and further drop handlers do not need to act.
     */
    handledByList: boolean;
}

export const mapDispatchToTreeListProps = dispatch => ({
    moveListItem: (_data: any, oldPath: string, newPath: string) => () => {
        // TODO get correct path
        const oldParentPath = oldPath;
        // TODO extract new index from end of new path
        const oldIndex = 0;
        // TODO get correct path
        const newParentPath = newPath;
        // TODO extract new index from end of new path
        const newIndex = 0;
        dispatch(
            update(
                oldParentPath,
                array => {
                    // TODO clone necessary?
                    const clone = _.clone(array);
                    clone.splice(oldIndex, 1);

                    return clone;
                }
            )
        );

        dispatch(
            update(
                newParentPath,
                array => {
                    if (array === undefined || array === null || array.length === 0) {
                        return [_data];
                    }

                    // TODO clone necessary
                    const clone = _.clone(array);
                    clone.splice(newIndex, 0, _data);

                    return clone;
                }
            )
        );
    }
});
