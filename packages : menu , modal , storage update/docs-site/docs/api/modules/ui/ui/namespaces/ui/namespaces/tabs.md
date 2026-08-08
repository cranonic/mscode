# tabs

## Functions

### registerTab()

> **registerTab**(`type`, `component`): `void`

Defined in: modules/ui/ui.d.ts:381

Registers a custom React component to be rendered when a specific tab `type` is opened.
This is the equivalent of VS Code's Custom Webview API, but powered natively by React!
*

#### Parameters

##### type

`string`

The unique type identifier of the tab (e.g., 'git-graph', 'database-viewer').

##### component

`ComponentType`\<`any`\>

The React component that will be rendered inside the tab.
*

#### Returns

`void`

#### Example

```ts
import { tabs } from '@mscode/ui';
* const MyCustomView = () => <div>Hello from Custom Tab!</div>;
tabs.registerTab('my-custom-view', MyCustomView);
* // Later, open it using the Window API:
// mscode.window.openTab({ id: 'view-1', title: 'My View', type: 'my-custom-view' });
```
