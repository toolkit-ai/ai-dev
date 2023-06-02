import fastify from "fastify";
import { execSync } from "child_process";

import fs, { readdirSync } from "fs";
import path from 'path';

import { run } from "./Agent";
import dotenv from 'dotenv';
dotenv.config();

const server = fastify({
    // logger: {
    //     //level: 
    // },
});

server.post("/task", async (request, reply) => {
  const { 
    githubToken,
    githubUsername,
    githubUserEmail,
    githubRepoOwner,
    githubRepoName,    
    githubBranch,
    taskDescription
  } = request.body as {
    
    githubToken: string;
    githubUsername: string;
    githubUserEmail: string;
    
    taskDescription: string;
    githubRepoOwner: string;
    githubRepoName: string;
    githubBranch: string;    
  };

  console.log({
    API: process.env.OPENAI_API_KEY
    })
  console.log('starting')
    console.log("received request", request.body)

    // Create a unique temp directory for each request
    const tempDir = fs.mkdtempSync('/tmp/repo-');

    // Call the git_operations.sh script with the required arguments
    const gitOperationsScript = path.resolve(__dirname, 'git_operations.sh');
    execSync(`bash ${gitOperationsScript} ${githubToken} ${githubUsername} ${githubUserEmail} ${githubRepoOwner} ${githubRepoName} ${githubBranch} ${tempDir}`);

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

        // Navigate to the tempDir that was created
        process.chdir(tempDir);

    // const fileReadTool = new FileReadTool();
    // const content = await fileReadTool.call({ path:files[4] })
    // console.log({ content })
        const result = await run({ 
            path:tempDir,
            taskDescription
        })


        return { status: "success", result, files, content: content  };
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