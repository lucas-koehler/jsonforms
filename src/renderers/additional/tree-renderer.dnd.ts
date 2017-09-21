import { JsonForms } from '../../core';
import { JsonSchema } from '../../models/jsonSchema';
import * as Sortable from 'sortablejs';

export type TreeNodeInfo = {data: object, schema: JsonSchema,
                            deleteFunction(toDelete: object): void};

export const DROP_TARGET_CSS = 'jsf-dnd-drop-target';
/**
 * Returns a function that handles the sortablejs onRemove event
 */
export const dragAndDropRemoveHandler = (treeNodeMapping: Map<HTMLLIElement, TreeNodeInfo>) =>
  evt => {
  const li = evt.item as HTMLLIElement;

  // TODO adapt to real condition: target list cannot contain dragged element
  // To be always consistent with add: could set attribute in add handler
  if (li.hasAttribute('wtf')) {
    const from = evt.from as HTMLElement;
    if (from.children.length <= evt.oldIndex) {
      console.log('dnd', 'remove-append');
      from.appendChild(li);
    } else {
      console.log('dnd', 'remove-adjacent ' + evt.oldIndex);
      from.children.item(evt.oldIndex).insertAdjacentElement('beforebegin', li);
    }

    return;
  }
  // remove end

  const nodeData = treeNodeMapping.get(li);
  const oldParent = evt.from.parentNode as HTMLLIElement;
  const parentData = treeNodeMapping.get(oldParent);
  const properties = JsonForms.schemaService.getContainmentProperties(parentData.schema);
  const nodeId = nodeData.schema.id;
  for (const property of properties) {
    const propertyId = property.schema.id;
    if (propertyId === nodeId) {
      property.deleteFromData(parentData.data)(nodeData.data);

      return;
    }
  }
};

/**
 * Returns a function that handles the SortableJs onUpdate event.
 * It is triggered when an element is moved inside a list.
 * It is not triggered when an element is dragged and then dropped at its original position.
 */
export const dragAndDropUpdateHandler = (treeNodeMapping: Map<HTMLLIElement, TreeNodeInfo>) =>
  evt => {
  const li = evt.item as HTMLLIElement;
  const nodeInfo = treeNodeMapping.get(li);
  // NOTE does not work on root elements
  const parentLi = li.parentNode.parentNode as HTMLLIElement;
  const parentInfo = treeNodeMapping.get(parentLi);
  const properties = JsonForms.schemaService.getContainmentProperties(parentInfo.schema);
  const nodeId = nodeInfo.schema.id;

  for (const property of properties) {
    const propertyId = property.schema.id;
    if (propertyId !== nodeId) {
      continue;
    }
    property.deleteFromData(parentInfo.data)(nodeInfo.data);
    if (evt.newIndex > evt.oldIndex) {
      const neighbour = li.previousElementSibling as HTMLLIElement;
      const neighbourData = treeNodeMapping.get(neighbour).data;
      property.addToData(parentInfo.data)(nodeInfo.data, neighbourData, true);
    } else if (evt.newIndex < evt.oldIndex) {
      const neighbour = li.nextElementSibling as HTMLLIElement;
      const neighbourData = treeNodeMapping.get(neighbour).data;
      property.addToData(parentInfo.data)(nodeInfo.data, neighbourData, false);
    }

    return;
  }
};

/**
 * Returns a function that handles the sortablejs onAdd Event.
 */
export const dragAndDropAddHandler = (treeNodeMapping: Map<HTMLLIElement, TreeNodeInfo>) =>
  evt => {
  const li = evt.item as HTMLLIElement;

  // TODO adapt to real condition: target list cannot contain dragged element
  if (li.hasAttribute('wtf')) {
    console.log('dnd', 'add cancel -> remove li');
    evt.to.removeChild(li);

    return;
  }
  // remove end

  const nodeInfo = treeNodeMapping.get(li);
  const newParent = evt.to.parentNode as HTMLLIElement;
  const parentInfo = treeNodeMapping.get(newParent);
  const properties = JsonForms.schemaService.getContainmentProperties(parentInfo.schema);
  const nodeId = nodeInfo.schema.id;

  /*
   * If the new data is not added at the end of the target list,
   * get the data that should follow the new data and use the fitting
   * containment property to add the new data.
   */
  for (const property of properties) {
    const propertyId = property.schema.id;
    if (propertyId === nodeId) {
      // NOTE: assume that a <ul> list only has <li> list elements as children
      // when this code is called: the added <li> is already part of the target <ul> list
      if (li.nextElementSibling !== null) {
        const neighbour = li.nextElementSibling as HTMLLIElement;
        const neighbourData = treeNodeMapping.get(neighbour).data;
        property.addToData(parentInfo.data)(nodeInfo.data, neighbourData, false);
      } else {
        property.addToData(parentInfo.data)(nodeInfo.data);
      }

      // if existing, update the moved element's delete function
      if (nodeInfo.deleteFunction !== undefined && nodeInfo.deleteFunction !== null) {
        const newDeleteFunction = property.deleteFromData(parentInfo.data);
        nodeInfo.deleteFunction = newDeleteFunction;
      }

      return;
    }
  }
  // TODO proper logging
  console.error('Failed Drag and Drop add due to missing property in target parent');
};

/**
 * Returns a function that handles the SortableJs onStart event.
 * The function sets the CSS class jsf-dnd-drop-target to all lists
 * that are compatible to the dragged element.
 *
 * @param treeElement The HTML element containing the tree
 * @param id the id identifying the type of the list's elements that this handler is used for
 */
export const dragAndDropStartHandler = (treeElement: HTMLElement, id: string) => evt => {
  const lists = treeElement.getElementsByTagName('UL');
  for (let i = 0; i < lists.length; i++) {
    const list = lists.item(i);
    if (list.getAttribute('childrenId') === id) {
      list.classList.toggle(DROP_TARGET_CSS, true);
    }
  }
};

/**
 * Returns a function that handles the SortableJs onEnd event.
 * The function removes the CSS class jsf-dnd-drop-target from all lists.
 *
 * @param treeElement The HTML element containing the tree
 * @param id the id identifying the type of the list's elements that this handler is used for
 */
export const dragAndDropEndHandler = (treeElement: HTMLElement, id: string) => evt => {
  const lists = treeElement.getElementsByTagName('UL');
  for (let i = 0; i < lists.length; i++) {
    lists.item(i).classList.toggle(DROP_TARGET_CSS, false);
  }
};

/**
 * Activates drag and drop for all direct children of the given list.
 *
 * @param treeElement The HTML element containing the tree
 * @param treeNodeMapping maps the trees renderer li nodes to their represented data, schema,
 *        and delete function
 * @param list the list that will support drag and drop
 * @param id the id identifying the type of the list's elements
 */
export const registerDnDWithGroupId = (treeElement: HTMLElement,
                                       treeNodeMapping: Map<HTMLLIElement, TreeNodeInfo>,
                                       list: HTMLUListElement, id: string) => {
  Sortable.create(list, {
    // groups with the same id allow to drag and drop elements between them
    group: id,
    // called after dragging started
    onStart: dragAndDropStartHandler(treeElement, id),
    // called after an element was added from another list
    onAdd: dragAndDropAddHandler(treeNodeMapping),
    // called when an element's position is changed within the same list
    onUpdate: dragAndDropUpdateHandler(treeNodeMapping),
    // called when an element is removed because it was moved to another list
    onRemove: dragAndDropRemoveHandler(treeNodeMapping),
    // called after dragging ended
    onEnd: dragAndDropEndHandler(treeElement, id)
  });
};
