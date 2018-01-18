// tslint:disable:jsx-no-multiline-js
import * as React from 'react';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import {
  getData,
  JsonSchema,
  resolveData,
  UISchemaElement,
  update
} from '@jsonforms/core';
import ExpandArray from './ExpandArray';
import { ContainmentProperty, SchemaService } from '../services/schema.service';
import { DragSource, DragSourceMonitor } from 'react-dnd';
import { DragInfo, Types } from './dnd.util';

const getNamingFunction =
  (schema: JsonSchema, uischema: UISchemaElement) => (element: Object): string => {
    if (uischema.options !== undefined) {
      const labelProvider = uischema.options.labelProvider;
      if (labelProvider !== undefined && labelProvider[schema.id] !== undefined) {
        return element[labelProvider[schema.id]];
      }
    }

    const namingKeys = Object.keys(schema.properties).filter(key => key === 'id' || key === 'name');
    if (namingKeys.length !== 0) {
      return element[namingKeys[0]];
    }

    return JSON.stringify(element);
  };

export interface ObjectListItemProps {
  path: string;
  schema: JsonSchema;
  uischema: UISchemaElement;
  rootData: any;
  data: any;
  selection: any;
  handlers: {
    onRemove?: any;
    onAdd: any;
    onSelect: any;
  };
  schemaService: SchemaService;
}

const ObjectListItem = (
  {
    path,
    schema,
    uischema,
    rootData,
    data,
    handlers,
    selection,
    schemaService
  }: ObjectListItemProps) => {

  const pathSegments = path.split('.');
  const parentPath = _.initial(pathSegments).join('.');
  const liClasses = selection === data ? 'selected' : '';
  const hasParent = !_.isEmpty(parentPath);
  const scopedData = resolveData(rootData, parentPath);
  const containmentProps = schemaService.getContainmentProperties(schema);
  const groupedProps = _.groupBy(containmentProps, property => property.property);

  // TODO: key should be set in caller
  return (
    <li className={liClasses} key={path}>
      <div>
        {
          _.has(uischema.options, 'imageProvider') ?
            <span className={`icon ${uischema.options.imageProvider[schema.id]}`} /> : ''
        }

        <span
          className='label'
          onClick={handlers.onSelect(schema, data, path)}
        >
          <span>
            {getNamingFunction(schema, uischema)(data)}
          </span>
          {
            schemaService.hasContainmentProperties(schema) ?
              (
                <span
                  className='add'
                  onClick={handlers.onAdd(schema, path)}
                >
                  {'\u2795'}
                </span>
              ) : ''
          }
          {
            (hasParent || _.isArray(scopedData)) &&
            <span
              className='remove'
              onClick={handlers.onRemove}
            >
              {'\u274C'}
            </span>
          }
        </span>
      </div>
      {
        Object.keys(groupedProps).map(groupKey =>
          <ExpandArray
            key={_.head(groupedProps[groupKey]).property}
            containmentProps={groupedProps[groupKey]}
            path={path}
            schema={schema}
            selection={selection}
            uischema={uischema}
            handlers={handlers}
            schemaService={schemaService}
          />
      )
    }
    </li>
  );
};

const mapStateToProps = state => {
  return {
    rootData: getData(state)
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {

  const parentPath = _.initial(ownProps.path.split('.')).join('.');

  return {
    remove(data) {
      dispatch(
        update(
          parentPath,
          array => _.filter(array.slice(), el => !_.isEqual(el, data))
        )
      );
    }
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const data = resolveData(stateProps.rootData, ownProps.path);

  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    data,
    handlers: {
      ...ownProps.handlers,
      onRemove() {
        return dispatchProps.remove(data);
      }
    }
  };
};

export interface ObjectListItemDndProps extends ObjectListItemProps {
  isRoot?: boolean;
  /**
   * The Containment Properties of the parent list containing this item.
   * Will be needed to determine whether another list item can be dropped next to this one.
   */
  parentProperties?: ContainmentProperty[];
  // Drag and Drop:
  connectDragSource;
}

const ObjectListItemDnd = (
  {
    path,
    schema,
    uischema,
    rootData,
    data,
    handlers,
    selection,
    schemaService,
    isRoot,
    connectDragSource
  }: ObjectListItemDndProps
) => {
  const listItem = (
    <ObjectListItem
      path={path}
      schema={schema}
      uischema={uischema}
      rootData={rootData}
      data={data}
      handlers={handlers}
      selection={selection}
      schemaService={schemaService}
    />
  );
  if (isRoot === true) {
    // No Drag and Drop
    return listItem;
  }

  // wrap in div because react-dnd does not allow directly connecting to components
  return connectDragSource(<div>{listItem}</div>);
};

/**
 * Define the drag and drop behavior of the list items
 */
const objectDragSource = {
  beginDrag(props, _monitor: DragSourceMonitor, _component) {
    const dragInfo: DragInfo = {
      path: props.path,
      data: props.data,
      schema: props.schema
    };

    console.log('drag started', props.path);

    return dragInfo;
  }
};

/**
 * Injects drag and drop related properties into an expanded array
 */
const collect = (dndConnect, _monitor) => {
  return {
    connectDragSource: dndConnect.dragSource()
  };
};

// TODO: probably also need to configure list items as a drop target to
// allow sortable behavior inside of lists

const listItemDnd = DragSource(Types.TREE_DND, objectDragSource, collect)(ObjectListItemDnd);
export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(listItemDnd);
