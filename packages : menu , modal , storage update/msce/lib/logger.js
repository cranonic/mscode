import chalk from 'chalk';
export const c = chalk;
export const log = {
  step:    (n, msg) => console.log(c.bold.magenta(`\n  [${n}] `) + c.bold(msg)),
  success: (msg) => console.log(c.green('  ✔ ') + msg),
  info:    (msg) => console.log(c.cyan('  ℹ ') + msg),
  blank:   ()    => console.log(),
};