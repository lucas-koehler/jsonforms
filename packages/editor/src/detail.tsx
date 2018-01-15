import * as React from 'react';
import { store } from './store';
import { Provider } from 'react-redux';
import { DispatchRenderer, getData, JsonSchema, UISchemaElement } from '@jsonforms/core';

export class Detail extends React.Component<{ schema: JsonSchema, uischema: UISchemaElement }> {
    render() {
        const { schema, uischema } = this.props;

        return (
            <div>
                <Provider store={store}>
                    <div>
                        {JSON.stringify(getData(store.getState()), null, 2)}
                        <DispatchRenderer schema={schema} uischema={uischema} />
                    </div>
                </Provider>
            </div>
        );
    }
}