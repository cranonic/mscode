
// === FIND: add imports ===
import { FindController } from '../find/FindController';

// === field ===
private find!: FindController;

// === after menu / commands init, before pointer ===
this.find = new FindController(
  this.root,
  this.model,
  this.selection,
  this.view,
  () => {
    this.view.ensureCaretVisible();
    this.syncTextarea();
    this.view.paint();
    this.emitContent();
  },
);
this.view.setFindDecorationsProvider(() => ({
  matches: this.find.getMatches(),
  currentIndex: this.find.getCurrentIndex(),
}));

// === registerDefaultKeybindings — add ===
this.keybindings.addMany([
  {
    id: 'actions.find',
    primary: 'ctrl+f',
    weight: 5,
    handler: () => this.find.startFind(),
  },
  {
    id: 'editor.action.startFindReplaceAction',
    primary: 'ctrl+h',
    weight: 5,
    handler: () => this.find.startFindReplace(),
  },
  {
    id: 'editor.action.nextMatchFindAction',
    primary: 'f3',
    weight: 5,
    handler: () => this.find.findNext(),
  },
  {
    id: 'editor.action.previousMatchFindAction',
    primary: 'shift+f3',
    weight: 5,
    handler: () => this.find.findPrevious(),
  },
]);

// Also register palette titles
this.commands.registerCommand('actions.find', () => this.find.startFind(), {
  title: 'Find',
  category: 'Find',
});
this.commands.registerCommand(
  'editor.action.startFindReplaceAction',
  () => this.find.startFindReplace(),
  { title: 'Replace', category: 'Find' },
);

// === dispose ===
this.find.dispose();

// === public API ===
revealFind(): void { this.find.startFind(); }
revealReplace(): void { this.find.startFindReplace(); }
