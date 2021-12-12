const fs = require('fs-extra');
const execSync = require('child_process').execSync;
const angularJson = fs.readJsonSync('./angular.json');

getApplications = (allProjects) => {
  return Object.entries(allProjects)
    .filter(([key, value]) => value.projectType === 'application')
    .map(([key, value]) => key);
};

const allApps = getApplications(angularJson.projects);

allApps.forEach((app) => {
  const command = `ng build ${app}`;
  console.log(`Running command: '${command}'`);
  execSync(command, { stdio: 'inherit' });
});
