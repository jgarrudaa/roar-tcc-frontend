const { spawnSync } = require('node:child_process');
const { readdirSync, readFileSync } = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const root = path.resolve(__dirname, '..');
function check(command, args) {
    const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: false });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status || 1);
}
for (const file of readdirSync(__dirname).filter(file => /^check_.*\.cjs$/.test(file) && !file.includes('_browser'))) {
    check(process.execPath, [path.join('tools', file)]);
}
function syntax(directory) {
    for (const entry of readdirSync(path.join(root, directory), { withFileTypes: true })) {
        const relative = path.join(directory, entry.name);
        if (entry.isDirectory()) syntax(relative);
        else if (entry.name.endsWith('.js')) check(process.execPath, ['--check', relative]);
    }
}
syntax('public/js');
// Workflow files are YAML, not Markdown snippets.
for (const name of readdirSync(path.join(root, '.github/workflows'))) {
    const source = readFileSync(path.join(root, '.github/workflows', name), 'utf8');
    const workflow = YAML.parse(source, { uniqueKeys: true });
    if (!workflow?.on || !workflow?.jobs) throw new Error(`Invalid workflow: ${name}`);
}
console.log('Frontend checks and JavaScript syntax passed.');
