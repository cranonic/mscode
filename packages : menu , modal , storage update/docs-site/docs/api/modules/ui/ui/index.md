# modules/ui/ui

## Namespaces

- [ui](namespaces/ui/index.md)

## Interfaces

### ButtonProps

Defined in: modules/ui/ui.d.ts:100

Configuration interface for the MS Code Native Button component.

#### Extends

- `ButtonHTMLAttributes`\<`HTMLButtonElement`\>

#### Properties

##### customStyle?

> `optional` **customStyle?**: `CSSProperties`

Defined in: modules/ui/ui.d.ts:116

Custom inline styles applied to the outer button container.

##### fullWidth?

> `optional` **fullWidth?**: `boolean`

Defined in: modules/ui/ui.d.ts:110

Forces the button to span 100% of its container width.

###### Default

```ts
false
```

##### icon?

> `optional` **icon?**: `ReactNode`

Defined in: modules/ui/ui.d.ts:106

Optional Codicon name or React element to display.

##### iconPosition?

> `optional` **iconPosition?**: `"left"` \| `"right"`

Defined in: modules/ui/ui.d.ts:108

Position of the icon relative to the children/label.

###### Default

```ts
'left'
```

##### narrow?

> `optional` **narrow?**: `boolean`

Defined in: modules/ui/ui.d.ts:112

Reduces the vertical and horizontal padding for tighter layouts.

###### Default

```ts
false
```

##### radius?

> `optional` **radius?**: `string`

Defined in: modules/ui/ui.d.ts:114

Custom border-radius override (e.g., '4px').

##### splitGap?

> `optional` **splitGap?**: `string` \| `number`

Defined in: modules/ui/ui.d.ts:128

The gap between split segments.

###### Default

```ts
'1px'
```

##### splitRatios?

> `optional` **splitRatios?**: `number`[]

Defined in: modules/ui/ui.d.ts:126

CSS Grid fractional ratios determining the width of each split segment.

###### Example

```ts
[6, 1] // First segment gets 6fr, second gets 1fr
```

##### splits?

> `optional` **splits?**: [`ButtonSplitProps`](#buttonsplitprops)[]

Defined in: modules/ui/ui.d.ts:122

Array of configuration objects to render a multi-segment "Split" button.
If provided, the standard `children` prop is ignored.

##### variant?

> `optional` **variant?**: `"type1"` \| `"type2"`

Defined in: modules/ui/ui.d.ts:104

Visual style variant of the button matching native IDE tokens.

###### Default

```ts
'type2'
```

***

### ButtonSplitProps

Defined in: modules/ui/ui.d.ts:86

Configuration for individual segments within a split-layout Button.

#### Extends

- `Omit`\<`ButtonHTMLAttributes`\<`HTMLButtonElement`\>, `"className"`\>

#### Properties

##### className?

> `optional` **className?**: `string`

Defined in: modules/ui/ui.d.ts:94

Custom CSS class for this segment.

##### icon?

> `optional` **icon?**: `ReactNode`

Defined in: modules/ui/ui.d.ts:88

Optional Codicon name or React element to display inside this specific split segment.

##### iconPosition?

> `optional` **iconPosition?**: `"left"` \| `"right"`

Defined in: modules/ui/ui.d.ts:90

Position of the icon relative to the label.

###### Default

```ts
'left'
```

##### label?

> `optional` **label?**: `ReactNode`

Defined in: modules/ui/ui.d.ts:92

Text label or content for this specific segment.

##### style?

> `optional` **style?**: `CSSProperties`

Defined in: modules/ui/ui.d.ts:96

Inline style overrides for this segment.

###### Overrides

`Omit.style`

***

### CollapsibleProps

Defined in: modules/ui/ui.d.ts:14

#### Properties

##### actionMenuId?

> `optional` **actionMenuId?**: `string`

Defined in: modules/ui/ui.d.ts:70

Custom ID for the action menu registration and overflow tracking.

##### actions?

> `optional` **actions?**: `any`[]

Defined in: modules/ui/ui.d.ts:67

Dynamic MS Code MenuItems to render on the right side. 
Automatically integrates with the IDE's SidebarActions engine.

##### children

> **children**: `ReactNode`

Defined in: modules/ui/ui.d.ts:61

The internal content revealed when expanded.

##### defaultExpanded?

> `optional` **defaultExpanded?**: `boolean`

Defined in: modules/ui/ui.d.ts:19

Initial expansion state if uncontrolled.

###### Default

```ts
true
```

##### expanded?

> `optional` **expanded?**: `boolean`

Defined in: modules/ui/ui.d.ts:22

Forces the expansion state (Controlled mode managed by parent).

##### fillHeight?

> `optional` **fillHeight?**: `boolean`

Defined in: modules/ui/ui.d.ts:37

Allows the content area to consume remaining flex space in a flex container.

##### headerStyle?

> `optional` **headerStyle?**: `CSSProperties`

Defined in: modules/ui/ui.d.ts:56

Custom inline styles specifically for the header row.

##### iconCollapsed?

> `optional` **iconCollapsed?**: `ReactNode`

Defined in: modules/ui/ui.d.ts:34

Custom icon name (Codicon) or React node when collapsed.

###### Default

```ts
'chevron-right'
```

##### iconExpanded?

> `optional` **iconExpanded?**: `ReactNode`

Defined in: modules/ui/ui.d.ts:31

Custom icon name (Codicon) or React node when expanded.

###### Default

```ts
'chevron-down'
```

##### isCollapsible?

> `optional` **isCollapsible?**: `boolean`

Defined in: modules/ui/ui.d.ts:28

If false, clicking the header will NOT toggle the content, and default chevrons are hidden.

###### Default

```ts
true
```

##### makeSticky?

> `optional` **makeSticky?**: `boolean`

Defined in: modules/ui/ui.d.ts:44

Makes the header stick to the top during scrolling.

##### maxOverflow?

> `optional` **maxOverflow?**: `number`

Defined in: modules/ui/ui.d.ts:73

Maximum number of inline actions to show before collapsing the rest into a '...' dropdown.

##### onHeaderClick?

> `optional` **onHeaderClick?**: (`e`) => `void`

Defined in: modules/ui/ui.d.ts:80

Callback fired when the header row is clicked.

###### Parameters

###### e

`any`

###### Returns

`void`

##### onHeaderContextMenu?

> `optional` **onHeaderContextMenu?**: (`e`) => `void`

Defined in: modules/ui/ui.d.ts:82

Callback fired when the user right-clicks the header row.

###### Parameters

###### e

`any`

###### Returns

`void`

##### onToggle?

> `optional` **onToggle?**: (`expanded`) => `void`

Defined in: modules/ui/ui.d.ts:25

Callback fired when the header is clicked and isCollapsible is true.

###### Parameters

###### expanded

`boolean`

###### Returns

`void`

##### rightActions?

> `optional` **rightActions?**: `ReactNode`

Defined in: modules/ui/ui.d.ts:76

Legacy support for rendering arbitrary React elements as actions on the right side.

##### showGuideLine?

> `optional` **showGuideLine?**: `boolean`

Defined in: modules/ui/ui.d.ts:40

Shows a vertical line on the left side of the content for visual grouping.

##### stickyLeft?

> `optional` **stickyLeft?**: `string` \| `number`

Defined in: modules/ui/ui.d.ts:50

The left offset when sticky.

##### stickyTop?

> `optional` **stickyTop?**: `number`

Defined in: modules/ui/ui.d.ts:46

The top offset when sticky.

###### Default

```ts
0
```

##### stickyZIndex?

> `optional` **stickyZIndex?**: `number`

Defined in: modules/ui/ui.d.ts:48

The Z-Index when sticky.

###### Default

```ts
10
```

##### style?

> `optional` **style?**: `CSSProperties`

Defined in: modules/ui/ui.d.ts:54

Custom inline styles for the outermost container.

##### title

> **title**: `ReactNode`

Defined in: modules/ui/ui.d.ts:16

The text or custom element to display in the header.

##### titleStyle?

> `optional` **titleStyle?**: `CSSProperties`

Defined in: modules/ui/ui.d.ts:58

Custom inline styles specifically for the title text wrapper.

***

### IconProps

Defined in: modules/ui/ui.d.ts:159

#### Properties

##### className?

> `optional` **className?**: `string`

Defined in: modules/ui/ui.d.ts:174

Standard optional wrapper layout class styling descriptor.

##### color?

> `optional` **color?**: `string`

Defined in: modules/ui/ui.d.ts:171

CSS hex, rgb, or variable color injected directly into the graphic instance.

##### name

> **name**: `string`

Defined in: modules/ui/ui.d.ts:165

Name of the target asset. Supports 3 configurations:
1. A recognized internal token (e.g., `'save'`, `'search'`).
2. A remote direct HTTP/HTTPS link or standalone Base64 DataURI.
3. A fallback standard fallback Codicon system string (e.g., `'bell'`, `'git-compare'`).

##### onClick?

> `optional` **onClick?**: (`e`) => `void`

Defined in: modules/ui/ui.d.ts:177

Optional event hook capturing user cursor touch or click frames.

###### Parameters

###### e

`MouseEvent`\<`HTMLElement`\>

###### Returns

`void`

##### size?

> `optional` **size?**: `number`

Defined in: modules/ui/ui.d.ts:168

Edge bounding box size width and height scale in pixels. Defaults to `16`.

##### style?

> `optional` **style?**: `CSSProperties`

Defined in: modules/ui/ui.d.ts:180

Fallback raw CSS structural style matrix properties.

##### title?

> `optional` **title?**: `string`

Defined in: modules/ui/ui.d.ts:183

Optional HTML browser descriptive hovering caption text.

***

### InputBoxProps

Defined in: modules/ui/ui.d.ts:186

#### Properties

##### className?

> `optional` **className?**: `string`

Defined in: modules/ui/ui.d.ts:211

* Optional CSS class appended to the outermost container for custom layout targeting.

##### disabled?

> `optional` **disabled?**: `boolean`

Defined in: modules/ui/ui.d.ts:207

Disables the input field, preventing user interaction and applying a dimmed visual state.

###### Default

```ts
false
```

##### ~~insideIcons?~~

> `optional` **insideIcons?**: `ReactNode`

Defined in: modules/ui/ui.d.ts:239

###### Deprecated

Legacy fallback prop. Use `rightInsideIcons` instead.

##### ~~leftIcon?~~

> `optional` **leftIcon?**: `ReactNode`

Defined in: modules/ui/ui.d.ts:237

###### Deprecated

Legacy fallback prop. Use `leftOutsideIcon` instead.

##### leftInsideIcon?

> `optional` **leftInsideIcon?**: `ReactNode`

Defined in: modules/ui/ui.d.ts:221

**Zone 2:** Action or descriptive icon embedded inside the input frame on the left.

###### Example

```ts
<Icon name="search" />
```

##### leftOutsideIcon?

> `optional` **leftOutsideIcon?**: `ReactNode`

Defined in: modules/ui/ui.d.ts:216

**Zone 1:** Icon rendered outside the input block on the far-left side.
Ideal for section anchors or structural labels.

##### onChange

> **onChange**: (`val`) => `void`

Defined in: modules/ui/ui.d.ts:194

Callback triggered immediately when the input text changes.

###### Parameters

###### val

`string`

The updated string value from the element.

###### Returns

`void`

##### ~~outsideIcons?~~

> `optional` **outsideIcons?**: `ReactNode`

Defined in: modules/ui/ui.d.ts:241

###### Deprecated

Legacy fallback prop. Use `rightOutsideIcons` instead.

##### placeholder?

> `optional` **placeholder?**: `string`

Defined in: modules/ui/ui.d.ts:197

Ghost placeholder text displayed when the input value is empty.

##### rightInsideIcons?

> `optional` **rightInsideIcons?**: `ReactNode`

Defined in: modules/ui/ui.d.ts:226

**Zone 3:** Icons layout stacked inside the input frame on the far-right side.
Perfect for control triggers like Regex toggles, Match Case, or Clear actions.

##### rightOutsideIcons?

> `optional` **rightOutsideIcons?**: `ReactNode`

Defined in: modules/ui/ui.d.ts:231

**Zone 4:** Icon layout positioned completely outside the input wrapper on the far-right.
Recommended for action triggers like "Go", "Submit", or return buttons.

##### type?

> `optional` **type?**: `string`

Defined in: modules/ui/ui.d.ts:202

Specifies the HTML input type (e.g., 'text', 'password', 'email', 'number').

###### Default

```ts
'text'
```

##### value

> **value**: `string`

Defined in: modules/ui/ui.d.ts:188

The current controlled string value of the input field.

***

### ModalProps

Defined in: modules/ui/ui.d.ts:247

Configuration schema for the MS Code Native Modal Component.

#### Properties

##### children

> **children**: `ReactNode`

Defined in: modules/ui/ui.d.ts:265

Inside markup nodes rendered straight within the scrollable content container body view layer.

##### footerActions?

> `optional` **footerActions?**: `ReactNode`

Defined in: modules/ui/ui.d.ts:276

Target action components (like Buttons) to append sequentially inside the sticky lower bottom panel zone.

###### Example

```tsx
<div style={{ display: 'flex', gap: '8px' }}>
<Button label="Cancel" variant="secondary" onClick={onClose} />
<Button label="Save Changes" onClick={handleSave} />
</div>
```

##### iconName?

> `optional` **iconName?**: `string`

Defined in: modules/ui/ui.d.ts:257

Optional icon token from the Codicon registry to be positioned right before the header title.

###### Example

```ts
'info', 'gear', 'warning'
```

##### isOpen

> **isOpen**: `boolean`

Defined in: modules/ui/ui.d.ts:249

Controls the visibility state of the modal viewport overlay.

##### onClose

> **onClose**: () => `void`

Defined in: modules/ui/ui.d.ts:262

Triggers immediately when clicking the close (X) icon button or hitting the `Escape` key.
Use this boundary frame callback to revert the `isOpen` state flag to false.

###### Returns

`void`

##### title

> **title**: `string`

Defined in: modules/ui/ui.d.ts:252

Primary header title string displayed at the top left of the modal wrapper.

***

### RichTextProps

Defined in: modules/ui/ui.d.ts:323

Properties configuration for the RichText component.

#### Properties

##### className?

> `optional` **className?**: `string`

Defined in: modules/ui/ui.d.ts:329

Custom CSS class names to append to the outer markdown container.

##### onLinkClick?

> `optional` **onLinkClick?**: (`target`) => `void`

Defined in: modules/ui/ui.d.ts:327

Callback fired when an internal link (e.g., #setting-id) is clicked.

###### Parameters

###### target

`string`

###### Returns

`void`

##### text?

> `optional` **text?**: `string`

Defined in: modules/ui/ui.d.ts:325

The raw markdown text to be rendered.

***

### SelectOption

Defined in: modules/ui/ui.d.ts:282

Defines the structure for an individual option inside the Select component.

#### Properties

##### description?

> `optional` **description?**: `string`

Defined in: modules/ui/ui.d.ts:288

Optional secondary details shown alongside the label

##### disabled?

> `optional` **disabled?**: `boolean`

Defined in: modules/ui/ui.d.ts:294

Determines if the individual option is interactive

##### label

> **label**: `string`

Defined in: modules/ui/ui.d.ts:286

The display label shown to the user

##### leftIcon?

> `optional` **leftIcon?**: `ReactNode`

Defined in: modules/ui/ui.d.ts:290

Optional element rendered on the left side of the option

##### rightIcon?

> `optional` **rightIcon?**: `ReactNode`

Defined in: modules/ui/ui.d.ts:292

Optional element rendered on the right side of the option

##### value

> **value**: `string`

Defined in: modules/ui/ui.d.ts:284

The technical value associated with the option

***

### SelectProps

Defined in: modules/ui/ui.d.ts:301

Properties configuration for the Select component.

#### Properties

##### className?

> `optional` **className?**: `string`

Defined in: modules/ui/ui.d.ts:311

Custom class names to append to the outer container

##### disabled?

> `optional` **disabled?**: `boolean`

Defined in: modules/ui/ui.d.ts:317

If true, disables the entire component and prevents interaction

##### onChange

> **onChange**: (`value`) => `void`

Defined in: modules/ui/ui.d.ts:307

Callback triggered when a new option is selected

###### Parameters

###### value

`string`

###### Returns

`void`

##### options

> **options**: [`SelectOption`](#selectoption)[]

Defined in: modules/ui/ui.d.ts:303

List of options to be rendered inside the dropdown

##### placement?

> `optional` **placement?**: `"top"` \| `"bottom"`

Defined in: modules/ui/ui.d.ts:315

Controls where the dropdown menu opens relative to the trigger button

##### style?

> `optional` **style?**: `CSSProperties`

Defined in: modules/ui/ui.d.ts:309

Inline styles applied directly to the outer container

##### value

> **value**: `string`

Defined in: modules/ui/ui.d.ts:305

The currently selected value

##### wrapOptions?

> `optional` **wrapOptions?**: `boolean`

Defined in: modules/ui/ui.d.ts:313

If true, wraps long text labels instead of truncating them

***

### SplitButtonOption

Defined in: modules/ui/ui.d.ts:132

Represents a single dropdown option within a SplitButton menu.

#### Properties

##### disabled?

> `optional` **disabled?**: `boolean`

Defined in: modules/ui/ui.d.ts:138

Disables this specific option, preventing interaction.

##### label

> **label**: `string`

Defined in: modules/ui/ui.d.ts:134

The display text of the menu option.

##### onClick

> **onClick**: () => `void`

Defined in: modules/ui/ui.d.ts:136

Callback executed when this specific option is selected.

###### Returns

`void`

***

### SplitButtonProps

Defined in: modules/ui/ui.d.ts:142

Configuration interface for the MS Code Native SplitButton component.

#### Properties

##### className?

> `optional` **className?**: `string`

Defined in: modules/ui/ui.d.ts:156

Optional CSS class appended to the outer container.

##### disabled?

> `optional` **disabled?**: `boolean`

Defined in: modules/ui/ui.d.ts:150

Disables the entire component (both main button and chevron).

###### Default

```ts
false
```

##### fullWidth?

> `optional` **fullWidth?**: `boolean`

Defined in: modules/ui/ui.d.ts:152

Forces the component to span 100% of its container width.

###### Default

```ts
false
```

##### label

> **label**: `string`

Defined in: modules/ui/ui.d.ts:144

The text label displayed on the main (primary) section of the button.

##### onClick

> **onClick**: () => `void`

Defined in: modules/ui/ui.d.ts:146

Callback executed when the main (primary) section of the button is clicked.

###### Returns

`void`

##### options

> **options**: [`SplitButtonOption`](#splitbuttonoption)[]

Defined in: modules/ui/ui.d.ts:148

Array of selectable options rendered in the dropdown menu when the chevron is clicked.

##### style?

> `optional` **style?**: `CSSProperties`

Defined in: modules/ui/ui.d.ts:154

Custom inline styles applied to the outer container.

## Type Aliases

### IconName

> **IconName** = `string`

Defined in: modules/ui/ui.d.ts:6
