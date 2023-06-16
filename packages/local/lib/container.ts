import { execSync } from 'child_process';
import path from 'path';
import { PORT } from './config';

const IMAGE_NAME = 'magnet-agent';
const CONTAINER_NAME = 'magnet-agent';

export function imageExists() {
  try {
    execSync(`docker image inspect ${IMAGE_NAME}`);
    return true;
  } catch (e) {
    return false;
  }
}

export function createImage() {
  return execSync(
    `cd ${path.join(
      __dirname,
      '..',
      '..'
    )}; docker build -t ${IMAGE_NAME} -f local/Dockerfile .`
  ).toString();
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
