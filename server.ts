import fastify from "fastify";
import { execSync } from "child_process";

import fs, { readdirSync } from "fs";
import path from 'path';
import FileReadTool from "./tools/FileReadTool";
import { run } from "./Agent";

const server = fastify({
    logger: {
        level: 'debug'
    },
});


server.post("/hello", async (request, reply) => {
    return { message: "Hello, world!" };
});

server.post("/update-repo", async (request, reply) => {
  const { 
    githubToken,
    githubUsername,
    githubUserEmail,
    githubRepoOwner,
    githubRepoName,    
    githubBranch,
    issueDescription
  } = request.body as {
    
    githubToken: string;
    githubUsername: string;
    githubUserEmail: string;
    
    issueDescription: string;
    githubRepoOwner: string;
    githubRepoName: string;
    githubBranch: string;    
  };

  console.log('starting')
    console.log("received request", request.body)

    // Create a unique temp directory for each request
    const tempDir = fs.mkdtempSync('/tmp/repo-');

    execSync('cd /tmp')
    execSync("rm -rf *"); // clears the filesystem
    
    // Set git config
    execSync(`git config --global user.name "${githubUsername}"`);
    execSync(`git config --global user.email "${githubUserEmail}"`);
 
    // Construct GitHub URL and clone the repository
    const githubUrl = `https://${githubToken}@github.com/${githubRepoOwner}/${githubRepoName}.git`;
    execSync(`git clone ${githubUrl} .`, { cwd: tempDir });
    execSync(`git checkout ${githubBranch} || git checkout -b ${githubBranch}`, { cwd: tempDir });
  
    
    // Get the list of files in the cloned repository
     const files = readdirSync(tempDir).map(file => path.resolve(tempDir, file));
     
     console.log('File path:', files[0]);
     let content;
     try {
        fs.accessSync(files[4], fs.constants.R_OK);
        console.log("Can read file");
    } catch (err) {
        console.error("Cannot read file", err);
    }
     try{
    // const fileReadTool = new FileReadTool();
    // const content = await fileReadTool.call({ path:files[4] })
    // console.log({ content })
        await run({ path:tempDir })

    return { status: "success", files, content: content  };
    }
    catch(e){
      console.log(e)
    }



});


server.listen(8080, '0.0.0.0', (err, address) => {
    if (err) {
      server.log.error(err);
      process.exit(1);
    }    
});