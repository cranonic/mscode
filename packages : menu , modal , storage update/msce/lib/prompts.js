import prompts from 'prompts';
import { c, log } from './logger.js';

export const onCancel = () => { log.blank(); console.log(c.yellow('  Cancelled.')); process.exit(0); };

export async function askQuestions(choices) {
  const { template } = await prompts({
    type: 'select', name: 'template', message: 'Template',
    choices: choices, hint: '↑↓ to move, Enter to select'
  }, { onCancel });

  const hasMain = ['basic', 'sidebar'].includes(template);
  let language = 'javascript';

  if (hasMain) {
    const ans = await prompts({
      type: 'select', name: 'language', message: 'Language',
      choices: [ { title: 'JavaScript', value: 'javascript' }, { title: 'TypeScript', value: 'typescript' } ]
    }, { onCancel });
    language = ans.language;
  }

  const meta = await prompts([
    {
      type: 'text', name: 'publisherName', message: 'Publisher ID ' + c.dim('(e.g. Mono Studio)'),
      initial: 'mono studio',
      format: val => val.trim().toLowerCase().replace(/\s+/g, '-'),
      validate: v => v.trim().length > 0 ? true : 'Publisher ID is required'
    },
    {
      type: 'text', name: 'extId', message: 'Extension ID ' + c.dim('(e.g. side)'),
      initial: 'my-extension',
      validate: v => /^[a-z0-9-]+$/.test(v) ? true : 'Format: lowercase letters, numbers, and dashes only',
    },
    { type: 'text', name: 'extName', message: 'Display name', initial: (_, v) => v.extId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
    { type: 'text', name: 'extDesc', message: 'Short description', initial: 'A Mono Studio extension.' },
    { type: 'text', name: 'outDir', message: 'Output folder name', initial: (_, v) => v.extId },
  ], { onCancel });

  const { license } = await prompts({
    type: 'select', name: 'license', message: 'License',
    choices: [ { title: 'MIT', value: 'MIT' }, { title: 'Apache 2.0', value: 'Apache-2.0' }, { title: 'GPL 3.0', value: 'GPL-3.0' }, { title: 'Proprietary', value: 'Proprietary' } ]
  }, { onCancel });

  return { template, hasMain, language, meta, license };
}