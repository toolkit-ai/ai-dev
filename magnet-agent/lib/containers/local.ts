import { execSync } from 'child_process';
import { PORT } from '../cli/config';

const IMAGE_NAME = 'magnet-agent';
const CONTAINER_NAME = 'magnet-agent';

export function isDockerDesktopInstalled() {
  try {
    execSync(`docker --version`);
    return true;
  } catch (e) {
    return false;
  }
}

export function isDockerDesktopRunning() {
  try {
    execSync(`docker info`);
    return true;
  } catch (e) {
    return false;
  }
}

export async function launchDockerDesktop() {
  try {
    execSync('docker info');
  } catch (e) {
    execSync('open -a Docker');
  }
}

export async function waitForDockerDesktop() {
  while (!isDockerDesktopRunning()) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

export function imageExists() {
  try {
    execSync(`docker image inspect ${IMAGE_NAME}`);
    return true;
  } catch (e) {
    return false;
  }
}

export function createImage(contextPath: string, dockerfilePath: string) {
  return execSync(
    `cd ${contextPath}; docker build -t ${IMAGE_NAME} -f ${dockerfilePath} .`
  );
}

export function containerExists() {
  try {
    execSync(`docker logs ${CONTAINER_NAME}`);
    return true;
  } catch (e) {
    return false;
  }
}

export function createContainer() {
  execSync(
    `docker run -d -p ${PORT}:${PORT} --name ${CONTAINER_NAME} ${IMAGE_NAME}`
  );
}

export function deleteContainer() {
  execSync(`docker stop ${CONTAINER_NAME}; docker rm ${CONTAINER_NAME}`);
}

export async function waitForServer() {
  while (true) {
    try {
      const logs = execSync(`docker logs ${CONTAINER_NAME}`).toString();
      if (logs.includes(`Server running on port ${PORT}`)) {
        break;
      }
    } catch (e) {
      console.error(e);
    }
  }
}
