import { exec as execCallback } from 'child_process';
import { promisify } from 'util';

import { version } from '../version';

const exec = promisify(execCallback);

const IMAGE_NAME = `magnet-agent-${version}`;
const CONTAINER_NAME = 'magnet-agent';

export async function isDockerDesktopInstalled() {
  try {
    await exec(`docker --version`);
    return true;
  } catch (e) {
    return false;
  }
}

export async function isDockerDesktopRunning() {
  try {
    await exec(`docker info`);
    return true;
  } catch (e) {
    return false;
  }
}

export async function launchDockerDesktop() {
  try {
    await exec('docker info');
  } catch (e) {
    await exec('open -a Docker');
  }
}

export async function waitForDockerDesktop() {
  let attempts = 0;
  while (attempts < 10) {
    if (await isDockerDesktopRunning()) {
      return;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 3000);
    });
    attempts++;
  }
  throw new Error('Docker Desktop did not start in time.');
}

export async function imageExists() {
  try {
    await exec(`docker image inspect ${IMAGE_NAME}`);
    return true;
  } catch (e) {
    return false;
  }
}

export async function createImage(contextPath: string, dockerfilePath: string) {
  return exec(
    `cd ${contextPath}; docker build -t ${IMAGE_NAME} -f ${dockerfilePath} .`
  );
}

export async function containerExists() {
  try {
    await exec(`docker logs ${CONTAINER_NAME}`);
    return true;
  } catch (e) {
    return false;
  }
}

export async function createContainer(port: number) {
  await exec(
    `docker run -d -p ${port}:${port} --name ${CONTAINER_NAME} ${IMAGE_NAME}`
  );
}

export async function deleteContainer() {
  await exec(`docker stop ${CONTAINER_NAME}; docker rm ${CONTAINER_NAME}`);
}

export async function waitForServer(port: number) {
  let attempts = 0;
  while (attempts < 10) {
    try {
      const { stdout: logs } = await exec(`docker logs ${CONTAINER_NAME}`);
      if (logs.includes(`Server running on port ${port}`)) {
        return;
      }
      await new Promise((resolve) => {
        setTimeout(resolve, 3000);
      });
      attempts++;
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
  throw new Error('Server did not start in time');
}
