const { execSync } = require('child_process');
const { writeFileSync } = require('fs');
const { join } = require('path');

const currentVersion = require('../lerna.json').version;
const originData = execSync('npx lerna ls --json').toString();
const data = JSON.parse(originData);

const arr = ['#!/bin/bash\n', `# timestamp: ${Date.now()}\n\n`];
const diff = ['\n# Changes:\n\n'];

for (const item of data) {

  if (item.private === false) {
    const remoteVersion = execSync(
      `npm show ${item.name} version`
    ).toString().replace('\n', '');

    const localVersion = item.version;
    console.log(`----> ${item.name} local=${localVersion} remote=${remoteVersion}`);

    if (remoteVersion !== localVersion) {
      arr.push(
        `npm dist-tag add ${item.name}@${remoteVersion} latest\n`
      );
      arr.push(
        `npm dist-tag add ${item.name}@${localVersion} beta\n`
      );
      arr.push(
        `tnpm dist-tag add ${item.name}@${remoteVersion} latest\n`
      );
      arr.push(
        `tnpm dist-tag add ${item.name}@${localVersion} latest\n`
      );
      diff.push(`#  - ${item.name}: ${remoteVersion} => ${currentVersion}\n`);
    }
  }
}

writeFileSync(join(__dirname, `./rollback/rollback-${currentVersion}.sh`), arr.join('') + diff.join(''));
